console.log("app_ES6.js connected");

class ChatClient {
    constructor() {
        this.socket = io();
        this.username = '';
        this.roomDiv = document.getElementById('room');
        this.realtimePointer = null; // initialize realtimePointer to null
        this.promptForUsername();
        this.registerSocketListeners();
        /* Realtime Pointer */
        if (!this.realtimePointer) {
            this.realtimePointer = new RealtimePointer(this.socket);
        }

        // Register socket listeners for pointer events
        this.socket.on('pointer_moved', (pointerDetails) => {
            // Remove all existing pointers
            this.realtimePointer.removeAllPointers();

            // Render all pointers in the pointerDetailsArray
            for (const pointerDetails of pointerDetailsArray) {
                this.realtimePointer.renderPointer(pointerDetails);
            }
        });

        // Add listener for 'pointers' event
        this.socket.on('pointers', (data) => {
            const pointers = data.pointers;
            for (const [id, pointer] of Object.entries(pointers)) {
                const el = document.querySelector(`#${id}`);
                if (el) {
                    el.style.left = `${pointer.x}px`;
                    el.style.top = `${pointer.y}px`;
                }
            }
        });
        this.circleAnimation = null; // initialize circleAnimation to null

        // add event listeners to change current color
        document.getElementById('yellow_btn').addEventListener('click', () => {
            this.circleAnimation.currentColor = 'yellow';
        });
        document.getElementById('purple_btn').addEventListener('click', () => {
            this.circleAnimation.currentColor = 'purple';
        });

        document.getElementById('green_btn').addEventListener('click', () => {
            this.circleAnimation.currentColor = 'green';
        });

        document.getElementById('blue_btn').addEventListener('click', () => {
            this.circleAnimation.currentColor = 'blue';
        });

        document.getElementById('clear_btn').addEventListener('click', () => {
            // Send a "clear" message to the server
            this.socket.emit('clear');
            return;
        });

        // Add a listener to receive the "clear" message from the server
        this.socket.on('clear', () => {
            // Remove all circles from the page
            this.circleAnimation.removeAllCircles();
            return;
        });

        if (!this.circleAnimation) {
            this.circleAnimation = new CircleAnimation(this.socket, this);
        }

    }

    promptForUsername() {
        while (!this.username) {
            this.username = prompt('What is your name?');
        }
        this.socket.emit('submitUsername', { username: this.username });
    }

    registerSocketListeners() {
        this.socket.on('active_members', (data) => {
            this.updateRoomDiv(data.active_members);
            if (!this.circleAnimation) {
                this.circleAnimation = new CircleAnimation(this.socket);
            }
        });

        this.socket.on('circle_animation', (circleDetailsArray) => {
            // remove all existing circles
            this.circleAnimation.removeAllCircles();

            // render all circles in the circleDetailsArray
            for (const circleDetails of circleDetailsArray) {
                this.circleAnimation.renderCircle(circleDetails);
            }
        });

    }
    updateRoomDiv(members) {
        this.roomDiv.innerHTML = '<h4>Members in the room:</h4>';
        for (let i = 0; i < members.length; i++) {
            const memberName = members[i];
            if (memberName === this.username) {
                this.roomDiv.innerHTML += `<p>[You] ${memberName} entered the room.</p>`;
            } else {
                this.roomDiv.innerHTML += `<p>${memberName} entered the room.</p>`;
            }
        }
    }
}
class CircleAnimation {
    constructor(socket, chatClient) {
        this.socket = socket;
        this.chatClient = chatClient;
        this.circleDiameter = 100;
        this.currentColor = 'var(--yellow)';
        document.addEventListener('click', this.handleClick.bind(this));
        this.renderCircle = this.renderCircle.bind(this); // bind renderCircle to the class instance
    }

    handleClick(event) {
        if (event.target.closest('#green_btn, #purple_btn, #yellow_btn, #blue_btn')) {
            this.currentColor = window.getComputedStyle(event.target).backgroundColor;
            return;
        }

        if (event.target.closest('#clear_btn')) { // Check if the "Clear" button was clicked
            return; // Return early without creating a new circle
        }

        // The rest of the code to create a new circle
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.textContent = this.chatClient.username;
        circle.style.position = 'absolute';
        circle.style.left = (event.pageX - (this.circleDiameter / 2)) + 'px';
        circle.style.top = (event.pageY - (this.circleDiameter / 2)) + 'px';
        circle.style.width = `${this.circleDiameter}px`;
        circle.style.height = `${this.circleDiameter}px`;
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = this.currentColor;
        circle.style.zIndex = -1;

        document.body.appendChild(circle);

        // Emit the circle_created event with the circle's details
        const circleDetails = {
            name: this.chatClient.username,
            color: this.currentColor,
            x: event.pageX - (this.circleDiameter / 2),
            y: event.pageY - (this.circleDiameter / 2),
            diameter: this.circleDiameter,
        };
        this.socket.emit('circle_created', circleDetails);
        this.renderCircle(circleDetails); // render the circle on the current client
    }

    renderCircle(circleDetails) {
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.textContent = circleDetails.name;
        circle.style.position = 'absolute';
        circle.style.left = circleDetails.x + 'px';
        circle.style.top = circleDetails.y + 'px';
        circle.style.width = `${circleDetails.diameter}px`;
        circle.style.height = `${circleDetails.diameter}px`;
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = circleDetails.color;
        circle.style.zIndex = -1;

        document.body.appendChild(circle);
    }

    removeAllCircles() {
        const circles = document.querySelectorAll('.circle');
        for (const circle of circles) {
            circle.remove();
        }
    }
}
class RealtimePointer {
    constructor(socket) {
        this.socket = socket;
        this.pointer = null;
        this.renderPointer = this.renderPointer.bind(this); // bind renderPointer to the class instance

        // Add event listener to handle the mousemove event
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    handleMouseMove(event) {
        if (!this.pointer) {
            this.pointer = document.createElement('div');
            this.pointer.classList.add('realtime-pointer');
            this.pointer.style.position = 'absolute';
            this.pointer.style.width = '15px';
            this.pointer.style.height = '15px';
            this.pointer.style.borderRadius = '50%';
            this.pointer.style.backgroundColor = 'red';
            this.pointer.style.zIndex = -1;

            document.body.appendChild(this.pointer);
        }

        // Set the position of the pointer
        this.pointer.style.left = event.pageX + 'px';
        this.pointer.style.top = event.pageY + 'px';

        // Emit the pointer_moved event with the pointer's position
        const pointerDetails = {
            x: event.pageX,
            y: event.pageY,
        };
        this.socket.emit('pointer_moved', pointerDetails);
    }

    renderPointer(pointerDetails) {
        const pointer = document.createElement('div');
        pointer.classList.add('realtime-pointer');
        pointer.style.position = 'absolute';
        pointer.style.width = '15px';
        pointer.style.height = '15px';
        pointer.style.borderRadius = '50%';
        pointer.style.backgroundColor = 'green';
        pointer.style.zIndex = -1;
        pointer.style.left = pointerDetails.x + 'px';
        pointer.style.top = pointerDetails.y + 'px';

        document.body.appendChild(pointer);
    }

    removeAllPointers() {
        const pointers = document.querySelectorAll('.realtime-pointer');
        for (const pointer of pointers) {
            pointer.remove();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chatClient = new ChatClient();
});
