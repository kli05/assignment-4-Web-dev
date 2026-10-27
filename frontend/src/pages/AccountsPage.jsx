import React, { useState, useEffect, useCallback } from "react";
import PageTitle from "../components/PageTitle";
import Notice from "../components/Notice";
import AccountEditor from "../components/AccountEditor";
import AccountTable from "../components/AccountTable";
import { fetchAccounts, createAccount, editAccount, removeAccount } from "../serverApi";

function AccountsPage(props) {
  const [users, setUsers] = useState([]);
  const [accountBeingEdited, setAccountBeingEdited] = useState(null);
  const [noticeKind, setNoticeKind] = useState("success");
  const [noticeText, setNoticeText] = useState("");

  const flash = useCallback(function (type, text) {
    setNoticeKind(type);
    setNoticeText(text);
  }, []);

  const refreshAccounts = useCallback(
    async function () {
      try {
        const userList = await fetchAccounts();
        setUsers(userList);
      } catch (error) {
        flash("error", error.message);
      }
    },
    [flash],
  );

  useEffect(
    function () {
      refreshAccounts();
    },
    [refreshAccounts],
  );

  const dismissNotice = useCallback(function () {
    setNoticeText("");
  }, []);

  async function submitAccount(userData) {
    try {
      if (accountBeingEdited !== null) {
        const storedUser = await editAccount(accountBeingEdited.id, userData);
        if (accountBeingEdited.id === props.activeUser.id) {
          props.onActiveUserChange(storedUser);
        }
        flash("success", userData.name + " was updated.");
        setAccountBeingEdited(null);
      } else {
        await createAccount(userData);
        flash("success", userData.name + " was added.");
      }
      await refreshAccounts();
      return true;
    } catch (error) {
      flash("error", error.message);
      return false;
    }
  }

  function beginEdit(user) {
    setAccountBeingEdited(user);
    setNoticeText("");
    window.scrollTo(0, 0);
  }

  async function confirmDelete(user) {
    if (user.id === props.activeUser.id) {
      flash("error", "You cannot delete the account you are logged in with.");
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete " + user.name + "?");
    if (confirmed === false) {
      return;
    }
    try {
      await removeAccount(user.id);
      await refreshAccounts();
      if (accountBeingEdited !== null && accountBeingEdited.id === user.id) {
        setAccountBeingEdited(null);
      }
      flash("success", user.name + " was deleted.");
    } catch (error) {
      flash("error", error.message);
    }
  }

  function stopEditing() {
    setAccountBeingEdited(null);
  }
  const loanTotals = {};
  for (let i = 0; i < users.length; i = i + 1) {
    loanTotals[users[i].id] = users[i].activeLoans;
  }

  return (
    <div>
      <PageTitle title="Accounts" />

      <Notice type={noticeKind} text={noticeText} onDismiss={dismissNotice} />

      <AccountEditor
        accountBeingEdited={accountBeingEdited}
        users={users}
        onCommit={submitAccount}
        onAbort={stopEditing}
      />

      <div className="box">
        <h2>All Users ({users.length})</h2>
        <AccountTable
          users={users}
          activeUserId={props.activeUser.id}
          loanTotals={loanTotals}
          onEdit={beginEdit}
          onRemove={confirmDelete}
        />
      </div>
    </div>
  );
}

export default AccountsPage;
