import React from "react";

function MetricCard(props) {
  let cardClass = "metric";
  if (props.flagged === true) {
    cardClass = "metric metric-alert";
  }

  return (
    <div className={cardClass}>
      <strong>{props.value}</strong>
      <span>{props.label}</span>
    </div>
  );
}

export default MetricCard;
