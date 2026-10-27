import React, { useEffect } from "react";

const NOTICE_MS = 5000;
function Notice(props) {
  const text = props.text;
  const onDismiss = props.onDismiss;

  useEffect(
    function () {
      let timeoutHandle = null;
      if (text && onDismiss) {
        timeoutHandle = setTimeout(onDismiss, NOTICE_MS);
      }

      return function () {
        if (timeoutHandle !== null) {
          clearTimeout(timeoutHandle);
        }
      };
    },
    [text, onDismiss],
  );
  if (!text) {
    return null;
  }
  let boxClass = "notice notice-success";
  if (props.type === "error") {
    boxClass = "notice notice-error";
  }

  return (
    <div className={boxClass} role="status">
      {text}
    </div>
  );
}

export default Notice;
