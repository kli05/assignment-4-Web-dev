import React from "react";
import { NavLink } from "react-router-dom";
import { roleText } from "../libraryUtils";

const ICONS = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10",
  loans: "M7 7h11l-3-3M17 17H6l3 3M4 12h16",
  ledger: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6",
  people: "M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0zM5 20a7 7 0 0 1 14 0",
  shelf: "M4 20V8l4-4h8l4 4v12zM9 20v-6h6v6",
};

function MenuIcon(props) {
  return (
    <svg className="side-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[props.name]} />
    </svg>
  );
}

function linkClass(linkInfo) {
  if (linkInfo.isActive) {
    return "side-link side-link-on";
  }

  return "side-link";
}

function SideMenu(props) {
  const isAdmin = props.activeUser.role === "admin";

  const adminItems = [
    { to: "/", label: "Overview", icon: "home", exact: true },
    { to: "/books", label: "Catalog", icon: "book" },
    { to: "/records", label: "Loans", icon: "loans" },
    { to: "/transactions", label: "Ledger", icon: "ledger" },
    { to: "/users", label: "Accounts", icon: "people" },
  ];
  const memberItems = [
    { to: "/", label: "Browse", icon: "book", exact: true },
    { to: "/my-books", label: "My shelf", icon: "shelf" },
  ];
  const items = isAdmin ? adminItems : memberItems;

  const links = [];
  for (let i = 0; i < items.length; i = i + 1) {
    const item = items[i];
    links.push(
      <NavLink key={item.to} to={item.to} end={item.exact === true} className={linkClass}>
        <MenuIcon name={item.icon} />
        <span>{item.label}</span>
      </NavLink>,
    );
  }

  const initial = props.activeUser.name.trim().charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">HM</span>
        <div>
          <strong>Ha Molibetsane</strong>
          <small>Community Library</small>
        </div>
      </div>

      <nav className="side-links" aria-label="Main navigation">
        {links}
      </nav>

      <div className="side-user">
        <span className="avatar">{initial}</span>
        <div className="side-user-text">
          <strong>{props.activeUser.name}</strong>
          <small>{roleText(props.activeUser.role)}</small>
        </div>
        <button className="signout" type="button" onClick={props.onSignOut}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default SideMenu;
