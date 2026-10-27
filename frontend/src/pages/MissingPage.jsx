import React from "react";
import { Link } from "react-router-dom";

function MissingPage() {
  return (
    <div className="box">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link className="act" to="/">
        Back to Overview
      </Link>
    </div>
  );
}

export default MissingPage;
