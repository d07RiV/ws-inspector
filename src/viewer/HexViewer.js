import React from 'react';
import classNames from 'classnames';
import './HexViewer.scss';

export default class HexViewer extends React.Component {
  render() {
    const { data, className, ...props } = this.props;
    let numDigits = 4;
    while (1 << (numDigits * 4) <= data.length) {
      numDigits += 1;
    }
    const lineNumbers = [], hexView = [], asciiView = [];
    const dot = ".".charCodeAt(0);
    for (let pos = 0; pos < data.length; pos += 16) {
      const row = [...data.subarray(pos, pos + 16)];
      lineNumbers.push(<li key={pos}>{pos.toString(16).padStart(numDigits, '0')}:</li>);
      hexView.push(<li key={pos}>
        {row.map((byte, i) => <span key={i}>{byte.toString(16).padStart(2, '0')}</span>)}
        {row.length < 16 && [...Array(16 - row.length)].map((nil, i) => <span key={i} className="padding">{"  "}</span>)}
      </li>);
      asciiView.push(<li key={pos}>{String.fromCharCode(...row.map(byte => byte >= 32 && byte <= 126 ? byte : dot))}</li>);
    }
    return (
      <div className={classNames(className, "HexViewer")} {...props}>
        <ul className="line-numbers">
          {lineNumbers}
        </ul>
        <ul className="hex-view" ref={node => this.hexView = node}>
          {hexView}
        </ul>
        <ul className="ascii-view" ref={node => this.asciiView = node}>
          {asciiView}
        </ul>
      </div>
    )
  }
}
