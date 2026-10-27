import React, { useState, useEffect, useCallback } from "react";
import PageTitle from "../components/PageTitle";
import Notice from "../components/Notice";
import MetricCard from "../components/MetricCard";
import LendingTable from "../components/LendingTable";
import DropdownField from "../components/DropdownField";
import { fetchLoans, checkinBook } from "../serverApi";
import { loanState } from "../libraryUtils";

const stateChoices = [
  {
    value: "all",
    label: "All records",
  },
  {
    value: "on-loan",
    label: "Currently on loan",
  },
  {
    value: "overdue",
    label: "Overdue",
  },
  {
    value: "returned",
    label: "Returned",
  },
];
function LoansPage(props) {
  const [records, setRecords] = useState([]);
  const [loanFilter, setLoanFilter] = useState("all");
  const [queryText, setQueryText] = useState("");
  const [noticeKind, setNoticeKind] = useState("success");
  const [noticeText, setNoticeText] = useState("");

  async function refreshLoans() {
    try {
      const recordList = await fetchLoans();
      setRecords(recordList);
    } catch (error) {
      setNoticeKind("error");
      setNoticeText(error.message);
    }
  }

  useEffect(function () {
    refreshLoans();
  }, []);

  const dismissNotice = useCallback(function () {
    setNoticeText("");
  }, []);

  function handleLoanFilterChange(event) {
    setLoanFilter(event.target.value);
  }

  function handleQueryChange(event) {
    setQueryText(event.target.value);
  }

  async function handleCheckin(record) {
    try {
      const result = await checkinBook(record.id, props.activeUser.id);
      setNoticeKind("success");
      setNoticeText(result.message);
    } catch (error) {
      setNoticeKind("error");
      setNoticeText(error.message);
    }
    await refreshLoans();
  }
  let onLoanCount = 0;
  let overdueCount = 0;
  let returnedCount = 0;
  for (let i = 0; i < records.length; i = i + 1) {
    const status = loanState(records[i]);
    if (status === "on-loan") {
      onLoanCount = onLoanCount + 1;
    }
    if (status === "overdue") {
      overdueCount = overdueCount + 1;
    }
    if (status === "returned" || status === "returned-late") {
      returnedCount = returnedCount + 1;
    }
  }
  const search = queryText.trim().toLowerCase();
  const shownLoans = [];
  for (let j = 0; j < records.length; j = j + 1) {
    const record = records[j];
    const status = loanState(record);
    let statusMatches = false;
    if (loanFilter === "all") {
      statusMatches = true;
    } else if (loanFilter === "returned") {
      statusMatches = status === "returned" || status === "returned-late";
    } else {
      statusMatches = status === loanFilter;
    }
    const allText = (record.userName + " " + record.membershipId + " " + record.bookTitle).toLowerCase();
    const searchMatches = search === "" || allText.indexOf(search) !== -1;
    if (statusMatches === true && searchMatches === true) {
      shownLoans.push(record);
    }
  }

  return (
    <div>
      <PageTitle title="Loans" />

      <div className="metrics">
        <MetricCard value={records.length} label="Total loans recorded" />
        <MetricCard value={onLoanCount + overdueCount} label="Books out right now" />
        <MetricCard value={overdueCount} label="Overdue" flagged={overdueCount > 0} />
        <MetricCard value={returnedCount} label="Returned" />
      </div>

      <Notice type={noticeKind} text={noticeText} onDismiss={dismissNotice} />

      <div className="box">
        <div className="box-head">
          <h2>Loan Records ({shownLoans.length})</h2>
          <div className="tools">
            <input
              className="search-box"
              type="text"
              placeholder="Search member, ID or book"
              value={queryText}
              onChange={handleQueryChange}
              aria-label="Search borrow records"
            />
            <DropdownField
              id="loanFilter"
              label="Show"
              value={loanFilter}
              onChange={handleLoanFilterChange}
              options={stateChoices}
            />
          </div>
        </div>
        <LendingTable
          records={shownLoans}
          withMember={true}
          withReturnDate={true}
          onCheckin={handleCheckin}
          checkinLabel="Mark Returned"
          emptyNote="No loan records match your search."
        />
      </div>
    </div>
  );
}

export default LoansPage;
