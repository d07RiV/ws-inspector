import React from 'react';
import Panel from 'react-flex-panel';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import HexViewer from './HexViewer';
import { ObjectInspector } from 'react-inspector';

import './App.scss';

const padded = (num, d) => num.toFixed(0).padStart(d, '0');

const stringToBuffer = str => {
  const ui8 = new Uint8Array(str.length);
  for (let i = 0; i < str.length; ++i) {
    ui8[i] = str.charCodeAt(i);
  }
  return ui8;
};

const TimeStamp = ({time}) => {
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();
  const ms = time.getMilliseconds();
  return <span className="timestamp">{padded(h, 2)}:{padded(m, 2)}:{padded(s, 2)}.{padded(ms, 3)}</span>;
};

const FrameEntry = ({frame, selected, ...props}) => (
  <li className={classNames("frame", "frame-" + frame.type, {"frame-selected": selected})} {...props}>
    <FontAwesome name={frame.type === "incoming" ? "arrow-circle-down" : "arrow-circle-up"}/>
    <TimeStamp time={frame.time}/>
    <span className="name">{frame.text != null ? "Text Frame" : "Binary Frame"}</span>
    <span className="length">{frame.length}</span>
  </li>
);

class FrameList extends React.Component {
  render() {
    const { frames, activeId, onSelect, onClear, ...props } = this.props;
    return (
      <Panel {...props} className="LeftPanel">
        <div className="list-controls">
          <FontAwesome className="list-button" name="ban" onClick={onClear} title="Clear"/>
        </div>
        <ul className="frame-list" onClick={() => onSelect(null)}>
          {frames.map(frame => <FrameEntry key={frame.id} frame={frame} selected={frame.id === activeId}
            onClick={e => { onSelect(frame.id); e.stopPropagation(); }}/>)}
        </ul>
      </Panel>
    );
  }
}

const TextViewer = ({data}) => (
  <div className="TextViewer tab-pane">
    {data}
  </div>
);

const JsonViewer = ({data}) => (
  <div className="JsonViewer tab-pane">
    <ObjectInspector data={data}/>
  </div>
);

class FrameView extends React.Component {
  state = {panel: null};

  makePanel(name, title) {
    return <li className={classNames("tab-button", {"active": this.state.panel === name})}
      onClick={() => this.setState({panel: name})}>{title}</li>;
  }

  static getDerivedStateFromProps(props, state) {
    const { frame } = props;
    const panels = [];
    if (frame.text != null) {
      panels.push("text");
      if (!frame.hasOwnProperty("json")) {
        try {
          frame.json = JSON.parse(frame.text);
        } catch {
          frame.json = undefined;
        }
      }
      if (frame.json !== undefined) {
        panels.push("json");
      }
    }
    if (frame.binary) {
      panels.push("hex");
    }
    if (!panels.includes(state.panel)) {
      return {panel: panels[0]};
    }
    return null;
  }

  render() {
    const { frame } = this.props;
    const { panel } = this.state;
    return (
      <div className="FrameView">
        <ul className="tab-line">
          {frame.text != null && this.makePanel("text", "Text")}
          {frame.json !== undefined && this.makePanel("json", "JSON")}
          {frame.binary != null && this.makePanel("hex", "Hex")}
        </ul>
        {panel === "text" && <TextViewer data={frame.text}/>}
        {panel === "json" && <JsonViewer data={frame.json}/>}
        {panel === "hex" && <HexViewer className="tab-pane" data={frame.binary}/>}
      </div>
    );
  }
}

export default class App extends React.Component {
  _uniqueId = 0;
  _issueTime = null;
  _issueWallTime = null;
  getTime(timestamp) {
    if (this._issueTime == null) {
      this._issueTime = timestamp;
      this._issueWallTime = new Date().getTime();
    }
    return new Date((timestamp - this._issueTime) * 1000 + this._issueWallTime);
  }

  state = {frames: [], activeId: null};

  constructor(props) {
    super(props);

    props.handlers["Network.webSocketFrameReceived"] = this.webSocketFrameReceived.bind(this);
    props.handlers["Network.webSocketFrameSent"] = this.webSocketFrameSent.bind(this);
  }

  render() {
    const { frames, activeId } = this.state;
    const active = frames.find(f => f.id === activeId);
    return (
      <Panel cols className="App">
        <FrameList size={300} minSize={180} resizable frames={frames} activeId={activeId} onClear={this.clearFrames} onSelect={this.selectFrame}/>
        <Panel minSize={100} className="PanelView">
          {active != null ? <FrameView frame={active}/> : <span className="message">Select a frame to view its contents</span>}
        </Panel>
      </Panel>
    );
  }

  selectFrame = id => {
    this.setState({activeId: id});
  };

  clearFrames = () => {
    this.setState({frames: []});
  };

  addFrame(type, timestamp, response) {
    if (response.opcode === 1 || response.opcode === 2) {
      const frame = {
        type,
        id: ++this._uniqueId,
        time: this.getTime(timestamp),
        length: response.payloadData.length,
      };
      if (response.opcode === 1) {
        frame.text = response.payloadData;
      } else {
        frame.binary = stringToBuffer(response.payloadData);
      }
      this.setState(({frames}) => ({frames: [...frames, frame]}));
    }
  }

  webSocketFrameReceived({timestamp, response}) {
    this.addFrame("incoming", timestamp, response);
  }
  webSocketFrameSent({timestamp, response}) {
    this.addFrame("outgoing", timestamp, response);
  }
}
