import React, { Component } from 'react';
import { TwitterPicker } from 'react-color';
import clientSocket from '../../socket';
import { EventEmitter } from 'events';
export const whiteboardEvents = new EventEmitter();

export class WhiteboardContainer extends Component {
  constructor(props) {
    super(props);
    this.canvas = null;
    this.ctx = null;
    this.previousColor = '';
    this.mousePositionCurrent = [0, 0];
    this.mousePositionPrevious = [0, 0];
    this.lineStart = [0, 0];
    this.lineEnd = [0, 0];

    this.state = {
      color: 'black',
      lineWidth: 2,
      isDrawing: false,
      eraserToggle: false,
      lineToggle: false
    };
  }

  componentDidMount() {
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', this.handleMousedown);
    this.canvas.addEventListener('mousemove', this.handleMousemove);
    this.canvas.addEventListener('mouseup', this.handleMouseup);

    clientSocket.on('wb-draw--from-server', (start, end, color, lineWidth) => {
      this.draw(start, end, color, lineWidth, false);
    });

    clientSocket.on('wb-clear--from-server', () => this.clear(false));
  }

  componentWillUnmount() {
    this.canvas.removeEventListener('mousedown', this.handleMousedown);
    this.canvas.removeEventListener('mousemove', this.handleMousemove);
    this.canvas.removeEventListener('mouseup', this.handleMouseup);
  }

  getMousePos(canvas, event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return [
      (event.clientX - rect.left) * scaleX,
      (event.clientY - rect.top) * scaleY
    ];
  };

  handleMousedown = event => {
    this.setState({ isDrawing: true });
    this.mousePositionCurrent = this.getMousePos(this.canvas, event);

    if (this.state.lineToggle)
      this.lineStart = this.getMousePos(this.canvas, event);
  };

  handleMouseup = event => {
    this.setState({ isDrawing: false });
    if (this.state.lineToggle) {
      this.lineEnd = this.getMousePos(this.canvas, event);
      this.draw(
        this.lineStart,
        this.lineEnd,
        this.state.color,
        this.state.lineWidth,
        true
      );
    }
  };

  handleMousemove = event => {
    if (this.state.isDrawing && !this.state.lineToggle) {
      this.mousePositionPrevious = this.mousePositionCurrent;
      this.mousePositionCurrent = this.getMousePos(this.canvas, event);
      this.draw(
        this.mousePositionPrevious,
        this.mousePositionCurrent,
        this.state.color,
        this.state.lineWidth,
        true
      );
    }
  };

  draw = (start, end, color, lineWidth, shouldBroadcast = true) => {
    this.ctx.beginPath();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.moveTo(...start);
    this.ctx.lineTo(...end);
    this.ctx.closePath();
    this.ctx.stroke();

    shouldBroadcast &&
      whiteboardEvents.emit('wb-draw', start, end, color, lineWidth);
  };

  clear = (shouldBroadcast = true) => {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    shouldBroadcast && whiteboardEvents.emit('wb-clear');
  };

  handleColorChange = color => {
    const formattedColor = `rgba(${Object.values(color.rgb)})`;
    this.setState({ color: formattedColor });
  };

  handleBrushSizeChange = event => {
    this.setState({ lineWidth: event.target.value });
  };

  toggleEraser = () => {
    if (this.state.color !== 'white') this.previousColor = this.state.color;
    this.state.eraserToggle
      ? this.setState({ color: this.previousColor })
      : this.setState({ color: 'white' });
    this.setState(prevState => {
      return {
        eraserToggle: !prevState.eraserToggle
      };
    });
  };

  toggleLine = () => {
    this.setState(prevState => {
      return {
        lineToggle: !prevState.lineToggle
      };
    });
  };

  render() {
    return (
      <div className="whiteboard">
        <div className="file-menu">
          <div className="level">
            <div className="level-left">
              <div className="level-item">
                <strong>Whiteboard</strong>
              </div>
              <div className="level-item">
                <div className="dropdown is-hoverable">
                  <div className="dropdown-trigger">
                    <button className="button">
                      <span>Settings</span>
                      <span className="icon is-small">
                        <i className="fas fa-cog" aria-hidden="true" />
                      </span>
                    </button>
                  </div>
                  <div className="dropdown-menu" id="menu-settings">
                    <div className="dropdown-content">
                      <TwitterPicker
                        color={this.state.color}
                        onChangeComplete={this.handleColorChange}
                        triangle="hide"
                        width="100%"
                      />

                      <form onSubmit={event => event.preventDefault()}>
                        <label>
                          Brush Size:
                          <input
                            type="number"
                            name="lineWidth"
                            value={this.state.lineWidth}
                            onChange={this.handleBrushSizeChange}
                          />
                        </label>
                      </form>

                      <button className="button" onClick={this.toggleEraser}>
                        {this.state.eraserToggle ? 'Brush' : 'Eraser'}
                      </button>
                      <button className="button" onClick={this.toggleLine}>
                        {this.state.lineToggle ? 'Brush' : 'Line'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="level-right">
              <div className="level-item">
                <button
                  className="button is-small is-primary"
                  onClick={this.clear}
                >
                  Clear
                </button>
              </div>
              <div className="level-item">
                <a
                  className="delete is-small"
                  onClick={this.props.closeWhiteboard}
                />
              </div>
            </div>
          </div>
        </div>
        <canvas id="canvas" ref={canvas => (this.canvas = canvas)} />
      </div>
    );
  }
}

export default WhiteboardContainer;
