import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import Notice from "../components/Notice";
import LendingTable from "../components/LendingTable";
import { fetchLoans, checkinBook } from "../serverApi";
import { LOAN_LIMIT, LOAN_PERIOD_DAYS } from "../libraryUtils";

function MyShelfPage(props) {
  const [records, setRecords] = useState([]);
  const [noticeKind, setNoticeKind] = useState("success");
  const [noticeText, setNoticeText] = useState("");
  const userId = props.activeUser.id;

  const refreshMyLoans = useCallback(
    async function () {
      try {
        const mine = await fetchLoans(userId);
        setRecords(mine);
      } catch (error) {
        setNoticeKind("error");
        setNoticeText(error.message);
      }
    },
    [userId],
  );

  useEffect(
    function () {
      refreshMyLoans();
    },
    [refreshMyLoans],
  );

  const dismissNotice = useCallback(function () {
    setNoticeText("");
  }, []);

  async function handleCheckin(record) {
    try {
      const result = await checkinBook(record.id, props.activeUser.id);
      setNoticeKind("success");
      setNoticeText(result.message);
    } catch (error) {
      setNoticeKind("error");
      setNoticeText(error.message);
    }
    await refreshMyLoans();
  }
  const currentLoans = [];
  const pastLoans = [];
  for (let j = 0; j < records.length; j = j + 1) {
    if (records[j].returnedAt === null) {
      currentLoans.push(records[j]);
    } else {
      pastLoans.push(records[j]);
    }
  }
  const emptyCurrentText = "You have no books at the moment.";

  return (
    <div>
      <PageTitle title="My Shelf" />

      <Notice type={noticeKind} text={noticeText} onDismiss={dismissNotice} />

      <div className="box">
        <h2>Books I Have Now ({currentLoans.length})</h2>
        <p className="box-note">
          You can hold up to {LOAN_LIMIT} books at a time. Each loan lasts {LOAN_PERIOD_DAYS} days, so please
          return books on time.
        </p>
        <LendingTable
          records={currentLoans}
          withMember={false}
          withReturnDate={false}
          onCheckin={handleCheckin}
          checkinLabel="Return Book"
          emptyNote={emptyCurrentText}
        />
        <p className="box-note">
          Looking for something to read? Go to <Link to="/">Browse Books</Link>.
        </p>
      </div>

      <div className="box">
        <h2>My Borrowing History ({pastLoans.length})</h2>
        <LendingTable
          records={pastLoans}
          withMember={false}
          withReturnDate={true}
          emptyNote="Books you return will be listed here."
        />
      </div>
    </div>
  );
}

export default MyShelfPage;
