
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { User } from "../types/pi.ts";

interface HeaderProps {
  onSignIn: () => void;
  onSignOut: () => void;
  onSendTestNotification: () => void;
  user: User | null;
  isLoading?: boolean;
}

const headerStyle: CSSProperties = {
  padding: 12,
  backgroundColor: "#172b24",
  color: "white",
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 10,
};

const userSectionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const buttonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid white",
  backgroundColor: "transparent",
  color: "white",
  cursor: "pointer",
  textDecoration: "none",
};

const Header = ({
  user,
  onSignIn,
  onSignOut,
  onSendTestNotification,
  isLoading,
}: HeaderProps) => {
  return (
    <header style={headerStyle}>
      <div style={{ fontWeight: "bold", fontSize: 18 }}>
        GFAMOUS MINERAL MARKET
      </div>

      <div style={userSectionStyle}>
        {user ? (
          <>
            <span>@{user.username}</span>

            {user.roles.includes("admin") && (
              <Link to="/admin" style={buttonStyle}>
                Admin Dashboard
              </Link>
            )}

            <button
              type="button"
              style={buttonStyle}
              onClick={onSignOut}
              disabled={isLoading}
            >
              Sign out
            </button>

            {user.roles.includes("core_team") && (
              <button
                type="button"
                style={buttonStyle}
                onClick={onSendTestNotification}
              >
                Send Test Notification
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            style={buttonStyle}
            onClick={onSignIn}
            disabled={isLoading}
          >
            Sign in with Pi
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
