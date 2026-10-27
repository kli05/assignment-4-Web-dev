import React from "react";
import { Link } from "react-router-dom";

function AdminGuard(props) {
  if (props.activeUser.role !== "admin") {
    return (
      <div className="box">
        <h2>Admins only</h2>
        <p>Your account does not have permission to open this page.</p>
        <Link className="act" to="/">
          Back to Overview
        </Link>
      </div>
    );
  }

  return props.children;
}

export default AdminGuard;
