import React  from "react";
import Button from "react-bootstrap/Button";
import arrowUp from "../static/baseline-arrow_upward-24px.svg";
import arrowDown from "../static/baseline-arrow_downward-24px.svg";
import "../style/FloatingButton.css";

export default function FloatingButtonGroup() {

  const scrollTop = () => {
    window.scrollTo(0, 0);
  };

  const scrollBottom = () => {
    window.scroll(0, document.body.scrollHeight);
  };

  return (
      <div>
        <Button variant="light" onClick={scrollTop} id="fab-up" className="shadow">
          <img src={arrowUp} alt=""/>
        </Button>
        <Button variant="light" onClick={scrollBottom} id="fab-down" className="shadow">
          <img src={arrowDown} alt=""/>
        </Button>
      </div>
  );
}