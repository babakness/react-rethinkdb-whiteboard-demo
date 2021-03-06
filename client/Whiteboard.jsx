import React from 'react';
import RR from 'react-rethinkdb';
const r = RR.r;

export const Whiteboard = React.createClass({
  mixins: [RR.DefaultMixin],

  observe(props, state) {
    return {
      lines: new RR.QueryRequest({
        query: r.table('lines').filter({boardId: props.boardId}),
        changes: true,
        initial: [],
      }),
    };
  },

  getInitialState() {
    return {
      point1: null,
      point2: null,
    };
  },

  mouseEventToSvgCoords(event) {
    const bounds = this.refs.svg.getBoundingClientRect();
    return {x: event.clientX - bounds.left, y: event.clientY - bounds.top};
  },

  usernameToColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = hash * 31 + username.charCodeAt(i);
    }
    const rand = Math.sin(hash) / 2 + 0.5;
    const hue = Math.floor(rand * 360);
    return `hsl(${hue}, 75%, 75%)`;
  },

  mouseDown(event) {
    if (!this.state.point1) {
      this.setState({point1: this.mouseEventToSvgCoords(event)});
    }
  },

  mouseUp(event) {
    if (this.state.point1 && this.state.point2) {
      const line = {
        boardId: this.props.boardId,
        username: this.props.username,
        x1: this.state.point1.x, y1: this.state.point1.y,
        x2: this.state.point2.x, y2: this.state.point2.y,
      };
      RR.DefaultSession.runQuery(r.table('lines').insert(line));
      this.setState({point1: null, point2: null});
    }
  },

  mouseMove(event) {
    if (this.state.point1) {
      this.setState({point2: this.mouseEventToSvgCoords(event)});
    }
  },

  clickLine(line) {
    if (!this.state.point1) {
      RR.DefaultSession.runQuery(r.table('lines').get(line.id).delete());
    }
  },

  render() {
    return (
      <svg
        ref="svg"
        style={{height: 300, width: 300, border: '1px solid black'}}
        onMouseDown={this.mouseDown}
        onMouseUp={this.mouseUp}
        onMouseMove={this.mouseMove}
      >
        {this.data.lines.value().map(line => (
          <line
            key={line.id}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke={this.usernameToColor(line.username)}
            strokeWidth={10}
            style={{cursor: 'pointer'}}
            onClick={() => this.clickLine(line)}
            onMouseDown={event => event.stopPropagation()}
          />
        ))}
        {this.state.point1 && this.state.point2 && (
          <line
            x1={this.state.point1.x} y1={this.state.point1.y}
            x2={this.state.point2.x} y2={this.state.point2.y}
            stroke={this.usernameToColor(this.props.username)}
            strokeWidth={5}
          />
        )}
      </svg>
    );
  },
});
