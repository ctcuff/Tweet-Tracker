import React from 'react';
import Form from 'react-bootstrap/Form';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import '../style/InputForm.css';

interface InputFormProps {
  isLoggedIn: boolean;
  onChange: (e: React.FormEvent<HTMLFormElement>) => void;
}

const InputForm = ({ isLoggedIn, onChange }: InputFormProps) => {
  const tooltip = (
    <Tooltip id="tooltip-bottom">
      {isLoggedIn
        ? 'Separate multiple words with commas'
        : 'You need log in first'}
    </Tooltip>
  );
  return (
    <OverlayTrigger placement="bottom" overlay={tooltip}>
      <Form.Control
        placeholder="Keyword(s):"
        type="text"
        className="input-container"
        // @ts-ignore
        onChange={onChange}
      />
    </OverlayTrigger>
  );
};

export default InputForm;
