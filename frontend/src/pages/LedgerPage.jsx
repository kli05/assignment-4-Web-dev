import React, { useState, useEffect, useCallback } from "react";
import PageTitle from "../components/PageTitle";
import Notice from "../components/Notice";
import StockAdjustForm from "../components/StockAdjustForm";
import HistoryTable from "../components/HistoryTable";
import { fetchBooks, fetchAccounts, fetchLedger, postStockChange, checkoutBook } from "../serverApi";

function LedgerPage(props) {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [noticeKind, setNoticeKind] = useState("success");
  const [noticeText, setNoticeText] = useState("");

  async function refreshStockData() {
    const bookList = await fetchBooks();
    const history = await fetchLedger();
    setBooks(bookList);
    setTransactions(history);
  }

  useEffect(function () {
    async function initialLoad() {
      try {
        await refreshStockData();
        const allUsers = await fetchAccounts();
        const justMembers = [];
        for (let i = 0; i < allUsers.length; i = i + 1) {
          if (allUsers[i].role === "member") {
            justMembers.push(allUsers[i]);
          }
        }
        setMembers(justMembers);
      } catch (error) {
        setNoticeKind("error");
        setNoticeText(error.message);
      }
    }
    initialLoad();
  }, []);

  const dismissNotice = useCallback(function () {
    setNoticeText("");
  }, []);

  async function applyStockChange(bookId, type, quantity, memberId) {
    let succeeded = false;
    try {
      let result = null;
      if (type === "deduct" && memberId !== "") {
        result = await checkoutBook(bookId, memberId, quantity, props.activeUser.id);
      } else {
        result = await postStockChange(bookId, type, quantity, props.activeUser.id);
      }
      setNoticeKind("success");
      setNoticeText(result.message);
      succeeded = true;
    } catch (error) {
      setNoticeKind("error");
      setNoticeText(error.message);
    }
    try {
      await refreshStockData();
    } catch (error) {
      setNoticeKind("error");
      setNoticeText(error.message);
    }

    return succeeded;
  }

  return (
    <div>
      <PageTitle title="Stock Ledger" />

      <Notice type={noticeKind} text={noticeText} onDismiss={dismissNotice} />

      <StockAdjustForm books={books} members={members} onStockChange={applyStockChange} />

      <div className="box">
        <h2>Transaction History</h2>
        <HistoryTable transactions={transactions} />
      </div>
    </div>
  );
}

export default LedgerPage;
