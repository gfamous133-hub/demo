
import { Router } from "express";
import { ObjectId } from "mongodb";

export default function mountMineralListingEndpoints(router: Router) {
  // Display approved mineral listings to buyers
  router.get("/approved", async (req, res) => {
    try {
      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const listings = await collection
        .find({ status: "approved" })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({ listings });
    } catch (error) {
      console.error("Error loading mineral listings:", error);
      return res.status(500).json({ error: "Failed to load listings" });
    }
  });

  // Submit a mineral listing for moderation
  router.post("/", async (req, res) => {
    try {
      const user = req.session.currentUser;

      if (!user) {
        return res.status(401).json({ error: "Please sign in first" });
      }

      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const {
        mineralType,
        description,
        location,
        weight,
        weightUnit,
        price,
        currency,
        contact,
        imageUrls,
      } = req.body;

      if (
        !mineralType ||
        !description ||
        !location ||
        weight === undefined ||
        !weightUnit ||
        price === undefined ||
        !currency ||
        !contact
      ) {
        return res.status(400).json({
          error: "Please complete all required fields",
        });
      }

      const images = Array.isArray(imageUrls) ? imageUrls : [];

      if (images.length > 5) {
        return res.status(400).json({
          error: "Maximum 5 image URLs allowed",
        });
      }

      const validImages = images.every((url: unknown) => {
        if (typeof url !== "string") return false;

        try {
          return new URL(url).protocol === "https:";
        } catch {
          return false;
        }
      });

      if (!validImages) {
        return res.status(400).json({
          error: "Images must use valid HTTPS URLs",
        });
      }

      const listing = {
        sellerId: user._id,
        sellerUsername: user.username,
        mineralType: String(mineralType).trim(),
        description: String(description).trim(),
        location: String(location).trim(),
        weight: Number(weight),
        weightUnit: String(weightUnit),
        price: Number(price),
        currency: String(currency),
        contact: String(contact).trim(),
        imageUrls: images,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (
        !Number.isFinite(listing.weight) ||
        listing.weight <= 0 ||
        !Number.isFinite(listing.price) ||
        listing.price <= 0
      ) {
        return res.status(400).json({
          error: "Weight and price must be positive numbers",
        });
      }

      const result = await collection.insertOne(listing);

      return res.status(201).json({
        message: "Listing submitted for review",
        listingId: result.insertedId,
        status: "pending",
      });
    } catch (error) {
      console.error("Error creating mineral listing:", error);
      return res.status(500).json({ error: "Failed to submit listing" });
    }
  });

  // Report an approved mineral listing
  router.post("/:id/report", async (req, res) => {
    try {
      const listingId = req.params.id;

      if (!ObjectId.isValid(listingId)) {
        return res.status(400).json({ error: "Invalid listing ID" });
      }

      const reports = req.app.locals.reportCollection;
      const listings = req.app.locals.mineralListingCollection;

      if (!reports || !listings) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const listing = await listings.findOne({
        _id: new ObjectId(listingId),
        status: "approved",
      });

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      const reason = String(req.body.reason || "").trim();

      if (!reason) {
        return res.status(400).json({
          error: "Please provide a report reason",
        });
      }

      await reports.insertOne({
        listingId: new ObjectId(listingId),
        reason,
        reporterId: req.session.currentUser?._id || null,
        status: "open",
        createdAt: new Date(),
      });

      return res.status(201).json({
        message: "Report submitted for review",
      });
    } catch (error) {
      console.error("Error reporting listing:", error);
      return res.status(500).json({ error: "Failed to submit report" });
    }
  });

  // Approve or reject listings by authorized moderators
  router.patch("/:id/moderation", async (req, res) => {
    try {
      const user = req.session.currentUser;

      if (
        !user ||
        !user.roles.some((role: string) =>
          ["core_team", "admin"].includes(role)
        )
      ) {
        return res.status(403).json({ error: "Moderator access required" });
      }

      const listingId = req.params.id;
      const status = req.body.status;

      if (!ObjectId.isValid(listingId)) {
        return res.status(400).json({ error: "Invalid listing ID" });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          error: "Status must be approved or rejected",
        });
      }

      const collection = req.app.locals.mineralListingCollection;

      if (!collection) {
        return res.status(503).json({ error: "Database unavailable" });
      }

      const result = await collection.updateOne(
        {
          _id: new ObjectId(listingId),
          status: "pending",
        },
        {
          $set: {
            status,
            reviewedBy: user.username,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          error: "Pending listing not found",
        });
      }

      return res.status(200).json({
        message: `Listing ${status}`,
      });
    } catch (error) {
      console.error("Error moderating listing:", error);
      return res.status(500).json({
        error: "Failed to review listing",
      });
    }
  });
}
