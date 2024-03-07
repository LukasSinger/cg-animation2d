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

        const numSides = 20;
        const radius = 20;
        const ballVertices = [];

        for (let i = 0; i < numSides; i++) {
            const angle = (2 * Math.PI * i) / numSides;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            ballVertices.push(CG.Vector3(x, y, 1));
        }

        this.models = {

            slide0: [
                {
                    vertices: ballVertices,
                    transform: new Matrix(3, 3),
                    velocity: { x: 5.75, y: 5.5 }
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
                    x: 150,
                    y: 150
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
                    x: 400,
                    y: 350
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
                    x: 650,
                    y: 500
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
                    x: 200,
                    y: 250
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
                    x: 550,
                    y: 400
                }
            ],
            slide3: []
        };

        CG.mat3x3Translate(this.models.slide0[0].transform, this.canvas.width / 2, this.canvas.height / 2);
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

            const ball = this.models.slide0[0];
            const velocity = ball.velocity;

            const new_x = ball.transform.values[0][2] + velocity.x * delta_time;
            const new_y = ball.transform.values[1][2] + velocity.y * delta_time;

            CG.mat3x3Translate(ball.transform, new_x, new_y);

            if (new_x <= 0 || new_x >= this.canvas.width) {
                velocity.x = -velocity.x;
            }
            if (new_y <= 0 || new_y >= this.canvas.height) {
                velocity.y = -velocity.y;
            }

            CG.mat3x3Translate(ball.transform, Math.max(0, Math.min(this.canvas.width, new_x)), Math.max(0, Math.min(this.canvas.height, new_y)));
        } else if (this.slide_idx === 1) {
            // Spinning polygons
            for (const polygon of this.models.slide1) {
                const delta_theta = polygon.angVelocity * delta_time;
                polygon.theta += delta_theta;
                const rotation = new Matrix(3, 3);
                CG.mat3x3Rotate(rotation, polygon.theta);
                const translation = new Matrix(3, 3);
                CG.mat3x3Translate(translation, polygon.x, polygon.y);
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
                CG.mat3x3Translate(translation, polygon.x, polygon.y);
                polygon.transform = Matrix.multiply([translation, scaling]);
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

    //
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

    //
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

            this.drawConvexPolygon(transformedVertices, [255, 0, 0, 255]);
        }
    }

    //
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

            this.drawConvexPolygon(transformedVertices, [0, 255, 0, 255]);
        }
    }


    //
    drawSlide3() {
        // TODO: get creative!
        //   - animation should involve all three basic transformation types
        //     (translation, scaling, and rotation)


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
