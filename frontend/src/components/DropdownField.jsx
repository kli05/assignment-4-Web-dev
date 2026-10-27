import React from "react";

function DropdownField(props) {
  const optionNodes = [];
  for (let i = 0; i < props.options.length; i = i + 1) {
    const option = props.options[i];
    optionNodes.push(
      <option key={option.value + "-" + i} value={option.value}>
        {option.label}
      </option>,
    );
  }
  let errorMessage = null;
  if (props.error) {
    errorMessage = <span className="field-problem">{props.error}</span>;
  }

  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <select id={props.id} name={props.id} value={props.value} onChange={props.onChange}>
        {optionNodes}
      </select>
      {errorMessage}
    </div>
  );
}

export default DropdownField;
