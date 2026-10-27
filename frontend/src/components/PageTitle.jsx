import React, { useContext } from "react";
import SessionContext from "../SessionContext";

function PageTitle(props) {
  const activeUser = useContext(SessionContext);
  let subtitle = props.subtitle;
  if (!subtitle && activeUser) {
    subtitle = "Welcome, " + activeUser.name;
  }

  return (
    <header className="page-title">
      <h1>{props.title}</h1>
      <p>{subtitle}</p>
    </header>
  );
}

export default PageTitle;
