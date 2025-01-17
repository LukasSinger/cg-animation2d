import * as CG from './transforms.js';
import { Matrix } from './matrix.js';

class Renderer {
    // canvas:              object ({id: __, width: __, height: __})
    // limit_fps_flag:      bool
    // fps:                 int
    constructor(canvas, limit_fps_flag, fps) {
        this.canvas = document.getElementById(canvas.id);
        this.canvas.width = canvas.width;
        this.canvas.height = canvas.height;
        this.ctx = this.canvas.getContext('2d');
        this.slide_idx = 0;
        this.limit_fps = limit_fps_flag;
        this.fps = fps;
        this.start_time = null;
        this.prev_time = null;

        this.models = {

            slide0: [
                {
                    vertices: [], // generated below
                    transform: new Matrix(3, 3),
                    velocity: { x: 5.75, y: 5.5 },
                    numSides: 20,
                    radius: 20,
                    position: { x: this.canvas.width / 2, y: this.canvas.height / 2 }
                }
            ],

            slide1: [
                {
                    vertices: [
                        CG.Vector3(-30, -30, 1),
                        CG.Vector3(30, -30, 1),
                        CG.Vector3(30, 30, 1),
                        CG.Vector3(-30, 30, 1)
                    ],
                    transform: new Matrix(3, 3),
                    angVelocity: 3,
                    theta: 0,
                    position: { x: 150, y: 150 }
                },
                {
                    vertices: [
                        CG.Vector3(-20, -20, 1),
                        CG.Vector3(20, -20, 1),
                        CG.Vector3(20, 20, 1),
                        CG.Vector3(-20, 20, 1)
                    ],
                    transform: new Matrix(3, 3),
                    angVelocity: 1,
                    theta: 0,
                    position: { x: 400, y: 350 }
                },
                {
                    vertices: [
                        CG.Vector3(-40, -15, 1),
                        CG.Vector3(40, -15, 1),
                        CG.Vector3(40, 15, 1),
                        CG.Vector3(-40, 15, 1)
                    ],
                    transform: new Matrix(3, 3),
                    angVelocity: -10,
                    theta: 0,
                    position: { x: 650, y: 500 }
                }
            ],

            slide2: [
                {
                    vertices: [
                        CG.Vector3(-30, -30, 1),
                        CG.Vector3(30, -30, 1),
                        CG.Vector3(30, 30, 1),
                        CG.Vector3(-30, 30, 1)
                    ],
                    transform: new Matrix(3, 3),
                    scaleVelocity: { x: 0.05, y: 0.05 },
                    scaleMagnitude: { x: 4, y: 4 },
                    scale: { x: 1, y: 1 },
                    position: { x: 200, y: 250 }
                },
                {
                    vertices: [
                        CG.Vector3(-20, -40, 1),
                        CG.Vector3(20, -40, 1),
                        CG.Vector3(20, 40, 1),
                        CG.Vector3(-20, 40, 1)
                    ],
                    transform: new Matrix(3, 3),
                    scaleVelocity: { x: 0.05, y: -0.00625 },
                    scaleMagnitude: { x: 5, y: 0.5 },
                    scale: { x: 1, y: 1 },
                    position: { x: 550, y: 400 }
                }
            ],

            slide3: [
                {
                    vertices: [
                        CG.Vector3(0, 0, 1),
                        CG.Vector3(this.canvas.width, 0, 1),
                        CG.Vector3(this.canvas.width, this.canvas.height, 1),
                        CG.Vector3(0, this.canvas.height, 1)
                    ],
                    transform: new Matrix(3, 3),
                    color: [0, 0, 0, 255]
                },
                {
                    vertices: [
                        CG.Vector3(-30, -30, 1),
                        CG.Vector3(30, -30, 1),
                        CG.Vector3(30, 30, 1),
                        CG.Vector3(-30, 30, 1)
                    ],
                    transform: new Matrix(3, 3),
                    angVelocity: 3,
                    theta: 0,
                    scaleVelocity: { x: 0.025, y: 0.025 },
                    scaleMagnitude: { x: 2.5, y: 2.5 },
                    scale: { x: 1, y: 1 },
                    radius: 62.5,
                    orbitCenter: { x: this.canvas.width / 2, y: this.canvas.height / 2 },
                    orbitSpeed: 0.001,
                    position: { x: null, y: null }, // calculated every frame
                    color: [0, 60, 200, 255]
                },
                {
                    vertices: [
                        CG.Vector3(-30, -25.981, 1),
                        CG.Vector3(30, -25.981, 1),
                        CG.Vector3(0, 25.981, 1),
                    ],
                    transform: new Matrix(3, 3),
                    angVelocity: -5,
                    theta: 0,
                    radius: 125,
                    orbitCenter: { x: null, y: null }, // calculated every frame
                    orbitSpeed: 0.003,
                    position: { x: null, y: null }, // calculated every frame
                    color: [230, 230, 235, 255]
                }
            ]
        };

        // Generate ball vertices
        const ball = this.models.slide0[0];
        for (let i = 0; i < ball.numSides; i++) {
            const angle = (2 * Math.PI * i) / ball.numSides;
            const x = ball.radius * Math.cos(angle);
            const y = ball.radius * Math.sin(angle);
            ball.vertices.push(CG.Vector3(x, y, 1));
        }
    }

    // flag:  bool
    limitFps(flag) {
        this.limit_fps = flag;
    }

    // n:  int
    setFps(n) {
        this.fps = n;
    }

    // idx: int
    setSlideIndex(idx) {
        this.slide_idx = idx;
    }

    animate(timestamp) {
        // Get time and delta time for animation
        if (this.start_time === null) {
            this.start_time = timestamp;
            this.prev_time = timestamp;
        }
        let time = timestamp - this.start_time;
        let delta_time = timestamp - this.prev_time;
        //console.log('animate(): t = ' + time.toFixed(1) + ', dt = ' + delta_time.toFixed(1));

        // Update transforms for animation
        this.updateTransforms(time, delta_time);

        // Draw slide
        this.drawSlide();

        // Invoke call for next frame in animation
        if (this.limit_fps) {
            setTimeout(() => {
                window.requestAnimationFrame((ts) => {
                    this.animate(ts);
                });
            }, Math.floor(1000.0 / this.fps));
        }
        else {
            window.requestAnimationFrame((ts) => {
                this.animate(ts);
            });
        }

        // Update previous time to current one for next calculation of delta time
        this.prev_time = timestamp;
    }

    //
    updateTransforms(time, delta_time) {
        // TODO: update any transformations needed for animation

        delta_time = delta_time / (1000.0 / 60);

        if (this.slide_idx === 0) {
            // Bouncing ball
            const ball = this.models.slide0[0];
            const velocity = ball.velocity;

            ball.position.x += velocity.x * delta_time;
            ball.position.y += velocity.y * delta_time;

            // Resolve any movement done past the magnitude bounds
            const min = { x: 0, y: 0 };
            const max = { x: this.canvas.width, y: this.canvas.height };
            let ballMinEdge = {};
            let ballMaxEdge = {};
            while (isOutOfBounds()) {
                for (const dim in ball.position) {
                    calcEdges(dim);
                    if (ballMaxEdge[dim] > max[dim]) {
                        // Reverse velocity direction
                        ball.velocity[dim] *= -1;
                        // Apply the offset from the bound in the opposite direction
                        ball.position[dim] -= 2 * (ballMaxEdge[dim] - max[dim]);
                    }
                    calcEdges(dim);
                    if (ballMinEdge[dim] < min[dim]) {
                        // Reverse velocity direction
                        ball.velocity[dim] *= -1;
                        // Apply the offset from the bound in the opposite direction
                        ball.position[dim] += 2 * (min[dim] - ballMinEdge[dim]);
                    }
                }
            }

            CG.mat3x3Translate(ball.transform, ball.position.x, ball.position.y);

            function calcEdges(dim) {
                ballMinEdge[dim] = ball.position[dim] - ball.radius;
                ballMaxEdge[dim] = ball.position[dim] + ball.radius;
            }

            function isOutOfBounds() {
                for (const dim in ball.position) {
                    calcEdges(dim);
                    if (ballMinEdge[dim] < min[dim] || ballMaxEdge[dim] > max[dim]) {
                        return true;
                    }
                }
                return false;
            }
        } else if (this.slide_idx === 1) {
            // Spinning polygons
            for (const polygon of this.models.slide1) {
                const delta_theta = polygon.angVelocity * delta_time;
                polygon.theta += delta_theta;
                const rotation = new Matrix(3, 3);
                CG.mat3x3Rotate(rotation, polygon.theta);
                const translation = new Matrix(3, 3);
                CG.mat3x3Translate(translation, polygon.position.x, polygon.position.y);
                polygon.transform = Matrix.multiply([translation, rotation]);
            }
        } else if (this.slide_idx === 2) {
            // Growing/shrinking polygons
            for (const polygon of this.models.slide2) {
                for (const dim in polygon.scale) {
                    const delta_scale = polygon.scaleVelocity[dim] * delta_time;
                    polygon.scale[dim] += delta_scale;

                    // Resolve any scaling done past the magnitude bounds
                    const maxSize = Math.max(1, polygon.scaleMagnitude[dim]);
                    const minSize = Math.min(1, polygon.scaleMagnitude[dim]);
                    while (polygon.scale[dim] > maxSize || polygon.scale[dim] < minSize) {
                        if (polygon.scale[dim] > maxSize) {
                            // Reverse velocity direction
                            polygon.scaleVelocity[dim] *= -1;
                            // Apply the offset from the bound in the opposite direction
                            polygon.scale[dim] -= 2 * (polygon.scale[dim] - maxSize);
                        }
                        if (polygon.scale[dim] < minSize) {
                            // Reverse velocity direction
                            polygon.scaleVelocity[dim] *= -1;
                            // Apply the offset from the bound in the opposite direction
                            polygon.scale[dim] += 2 * (minSize - polygon.scale[dim]);
                        }
                    }
                }
                const scaling = new Matrix(3, 3);
                CG.mat3x3Scale(scaling, polygon.scale.x, polygon.scale.y);
                const translation = new Matrix(3, 3);
                CG.mat3x3Translate(translation, polygon.position.x, polygon.position.y);
                polygon.transform = Matrix.multiply([translation, scaling]);
            }
        } else if (this.slide_idx === 3) {
            // Spinning, growing/shrinking, and orbiting polygons
            for (const polygon of this.models.slide3) {
                // Ignore the background
                if (polygon == this.models.slide3[0]) continue;
                if (polygon == this.models.slide3[2]) {
                    // Set orbit center to the square's current position
                    polygon.orbitCenter.x = this.models.slide3[1].position.x;
                    polygon.orbitCenter.y = this.models.slide3[1].position.y;
                }
                const delta_theta = polygon.angVelocity * delta_time;
                polygon.theta += delta_theta;
                const rotation = new Matrix(3, 3);
                CG.mat3x3Rotate(rotation, polygon.theta);

                polygon.position.x = polygon.orbitCenter.x; 
                polygon.position.y = polygon.orbitCenter.y;
                if (polygon == this.models.slide3[2]) {
                    // Give moon extra radius based on scaling of square
                    const square = this.models.slide3[1];
                    polygon.position.x += polygon.radius * square.scale.x * Math.cos(time * polygon.orbitSpeed);
                    polygon.position.y += polygon.radius * square.scale.y * Math.sin(time * polygon.orbitSpeed);
                } else {
                    polygon.position.x += polygon.radius * Math.cos(time * polygon.orbitSpeed);
                    polygon.position.y += polygon.radius * Math.sin(time * polygon.orbitSpeed);
                }
                const translation = new Matrix(3, 3);
                CG.mat3x3Translate(translation, polygon.position.x, polygon.position.y);

                if (polygon == this.models.slide3[2]) {
                    // The moon triangle should inherit the square's scaling
                    polygon.scale = this.models.slide3[1].scale;
                } else {
                    for (const dim in polygon.scale) {
                        const delta_scale = polygon.scaleVelocity[dim] * delta_time;
                        polygon.scale[dim] += delta_scale;

                        const maxSize = Math.max(1, polygon.scaleMagnitude[dim]);
                        const minSize = Math.min(1, polygon.scaleMagnitude[dim]);
                        while (polygon.scale[dim] > maxSize || polygon.scale[dim] < minSize) {
                            if (polygon.scale[dim] > maxSize) {
                                polygon.scaleVelocity[dim] *= -1;
                                polygon.scale[dim] -= 2 * (polygon.scale[dim] - maxSize);
                            }
                            if (polygon.scale[dim] < minSize) {
                                polygon.scaleVelocity[dim] *= -1;
                                polygon.scale[dim] += 2 * (minSize - polygon.scale[dim]);
                            }
                        }
                    }
                }
                const scaling = new Matrix(3, 3);
                CG.mat3x3Scale(scaling, polygon.scale.x, polygon.scale.y);

                polygon.transform = Matrix.multiply([translation, scaling, rotation]);
            }
        }
    }

    //
    drawSlide() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.slide_idx) {
            case 0:
                this.drawSlide0();
                break;
            case 1:
                this.drawSlide1();
                break;
            case 2:
                this.drawSlide2();
                break;
            case 3:
                this.drawSlide3();
                break;
        }
    }

    // Draw a bouncing ball
    drawSlide0() {
        // TODO: draw bouncing ball (circle that changes direction whenever it hits an edge)

        const ball = this.models.slide0[0];
        const transformedVertices = [];

        for (let i = 0; i < ball.vertices.length; i++) {
            const vertex = ball.vertices[i];
            const transformedVertex = Matrix.multiply([ball.transform, vertex]);
            transformedVertices.push(transformedVertex);
        }

        this.drawConvexPolygon(transformedVertices, [255, 0, 0, 255]);
    }

    // Draw spinning polygons
    drawSlide1() {
        // TODO: draw at least 3 polygons that spin about their own centers
        //   - have each polygon spin at a different speed / direction

        for (let i = 0; i < this.models.slide1.length; i++) {
            const polygon = this.models.slide1[i];
            const transformedVertices = [];

            for (let j = 0; j < polygon.vertices.length; j++) {
                const vertex = polygon.vertices[j];
                const transformedVertex = Matrix.multiply([polygon.transform, vertex]);
                transformedVertices.push(transformedVertex);
            }

            this.drawConvexPolygon(transformedVertices, [0, 255, 0, 255]);
        }
    }

    // Draw growing/shrinking polygons
    drawSlide2() {
        // TODO: draw at least 2 polygons grow and shrink about their own centers
        //   - have each polygon grow / shrink different sizes
        //   - try at least 1 polygon that grows / shrinks non-uniformly in the x and y directions

        for (let i = 0; i < this.models.slide2.length; i++) {
            const polygon = this.models.slide2[i];
            const transformedVertices = [];

            for (let j = 0; j < polygon.vertices.length; j++) {
                const vertex = polygon.vertices[j];
                const transformedVertex = Matrix.multiply([polygon.transform, vertex]);
                transformedVertices.push(transformedVertex);
            }

            this.drawConvexPolygon(transformedVertices, [0, 0, 255, 255]);
        }
    }

    // Draw spinning, growing/shrinking, and orbiting polygons
    drawSlide3() {
        // TODO: get creative!
        //   - animation should involve all three basic transformation types
        //     (translation, scaling, and rotation)

        for (let i = 0; i < this.models.slide3.length; i++) {
            const polygon = this.models.slide3[i];
            const transformedVertices = [];

            for (let j = 0; j < polygon.vertices.length; j++) {
                const vertex = polygon.vertices[j];
                const transformedVertex = Matrix.multiply([polygon.transform, vertex]);
                transformedVertices.push(transformedVertex);
            }

            this.drawConvexPolygon(transformedVertices, polygon.color);
        }
    }

    // vertex_list:  array of object [Matrix(3, 1), Matrix(3, 1), ..., Matrix(3, 1)]
    // color:        array of int [R, G, B, A]
    drawConvexPolygon(vertex_list, color) {
        this.ctx.fillStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',' + (color[3] / 255) + ')';
        this.ctx.beginPath();
        let x = vertex_list[0].values[0][0] / vertex_list[0].values[2][0];
        let y = vertex_list[0].values[1][0] / vertex_list[0].values[2][0];
        this.ctx.moveTo(x, y);
        for (let i = 1; i < vertex_list.length; i++) {
            x = vertex_list[i].values[0][0] / vertex_list[i].values[2][0];
            y = vertex_list[i].values[1][0] / vertex_list[i].values[2][0];
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
};

export { Renderer };
