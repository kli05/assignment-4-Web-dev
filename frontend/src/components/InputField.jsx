import React from "react";

function InputField(props) {
  let errorMessage = null;
  if (props.error) {
    errorMessage = <span className="field-problem">{props.error}</span>;
  }
  let hintMessage = null;
  if (props.hint) {
    hintMessage = <span className="field-note">{props.hint}</span>;
  }

  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        name={props.id}
        type={props.type}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        min={props.min}
        disabled={props.disabled}
      />
      {hintMessage}
      {errorMessage}
    </div>
  );
}

export default InputField;
