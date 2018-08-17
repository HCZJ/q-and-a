import React, { Component } from 'react';
import { TwitterPicker } from 'react-color';

// import Whiteboard from './whiteboard';

export class WhiteboardContainer extends Component {
  state = {
    color: 'black',
    lineWidth: 2,
    isDrawing: false,
    eraserToggle: false,
    lineToggle: false
  };

  canvas = null;
  ctx = null;
  previousColor = '';
  mousePositionCurrent = [0, 0];
  mousePositionPrevious = [0, 0];
  lineStart = [0, 0];
  lineEnd = [0, 0];

  componentDidMount() {
    const { socket } = this.props;
    socket.on('wb-draw', (start, end, color, lineWidth) => {
      this.draw(start, end, color, lineWidth);
    });
    socket.on('wb-clear', () => {
      this.clear();
    });

    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', this.mouseDown);
    this.canvas.addEventListener('mousemove', this.mouseMove);
    this.canvas.addEventListener('mouseup', this.mouseUp);
  }

  draw = (start, end, color, lineWidth) => {
    this.ctx.beginPath();
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.moveTo(...start);
    this.ctx.lineTo(...end);
    this.ctx.closePath();
    this.ctx.stroke();
    this.props.socket.emit('wb-draw-event', start, end, color, lineWidth);
  };

  mouseDown = event => {
    this.setState({ isDrawing: true });
    this.mousePositionCurrent = this.getMousePos(this.canvas, event);

    if (this.state.lineToggle)
      this.lineStart = this.getMousePos(this.canvas, event);
  };

  getMousePos(canvas, evt) {
    var rect = this.canvas.getBoundingClientRect(), // abs. size of element
      scaleX = canvas.width / rect.width, // relationship bitmap vs. element for X
      scaleY = canvas.height / rect.height; // relationship bitmap vs. element for Y

    return [
      (evt.clientX - rect.left) * scaleX, // scale mouse coordinates after they have
      (evt.clientY - rect.top) * scaleY // been adjusted to be relative to element
    ];
  }

  mouseUp = event => {
    this.setState({ isDrawing: false });
    if (this.state.lineToggle) {
      this.lineEnd = this.getMousePos(this.canvas, event);
      this.draw(
        this.lineStart,
        this.lineEnd,
        this.state.color,
        this.state.lineWidth
      );
    }
  };

  mouseMove = event => {
    if (this.state.isDrawing && !this.state.lineToggle) {
      this.mousePositionPrevious = this.mousePositionCurrent;
      this.mousePositionCurrent = this.getMousePos(this.canvas, event);
      console.log(this.mousePositionCurrent);
      console.log(event);
      // this.mousePositionPrevious &&
      //   this.mousePositionCurrent &&
      this.draw(
        this.mousePositionPrevious,
        this.mousePositionCurrent,
        this.state.color,
        this.state.lineWidth
      );
    }
  };

  colorChange = color => {
    const converted = `rgba(${Object.values(color.rgb)})`;
    this.setState({ color: converted });
  };

  clear = () => {
    this.ctx.clearRect(
      0,
      0,
      document.getElementById('whiteboard').offsetWidth,
      document.getElementById('whiteboard').offsetWidth
    );
    this.props.socket.emit('wb-clear-event');
  };

  changeBrushSize = event => {
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
    console.log(document.getElementsByClassName('whiteboard'));
    return (
      <div className="whiteboard">
        <canvas
          id="canvas"
          width={window.innerWidth}
          height={window.innerHeight}
          // width={document.getElementsByClassName('whiteboard')[0].clientWidth}
          // height={
          //   document.getElementsByClassName('whiteboard')[0].clientHeight
          //}
          ref={canvas => (this.canvas = canvas)}
        />
        <div className="whiteboard-menu level">
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
                <div className="dropdown-menu" id="whiteboard-menu">
                  <div className="dropdown-content">
                    <TwitterPicker
                      color={this.state.color}
                      onChangeComplete={this.colorChange}
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
                          onChange={this.changeBrushSize}
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
            <div className="level-item">
              <button
                className="button is-small is-primary"
                onClick={this.clear}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <a
                className="delete is-small"
                onClick={this.props.closeWhiteboard}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default WhiteboardContainer;
