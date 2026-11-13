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
message: Listing ${status},
});
} catch (error) {
console.error("Error moderating listing:", error);
return res.status(500).json({
error: "Failed to review listing",
});
}
});
}
