import React from "react";
import { stockLevel, stockLevelText } from "../libraryUtils";

function StockTag(props) {
  const status = stockLevel(props.quantity);
  return <span className={"tag tag-" + status}>{stockLevelText(props.quantity)}</span>;
}

export default StockTag;
