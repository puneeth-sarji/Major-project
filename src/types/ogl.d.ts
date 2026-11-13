declare module 'ogl' {
  export class Renderer {
    constructor(options?: any);
    gl: any;
    setSize(width: number, height: number): void;
    render(options: { scene: any; camera?: any }): void;
  }
  export class Triangle {
    constructor(gl: any, options?: any);
  }
  export class Program {
    constructor(gl: any, options: any);
    uniforms: Record<string, { value: any }>;
  }
  export class Mesh {
    constructor(gl: any, options: any);
  }
  export class Vec2 {
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
  }
  export class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
  }
  export class Camera {
    constructor(gl: any, options?: any);
    position: Vec3;
    perspective(options?: any): void;
    lookAt(target: any): void;
  }
  export class Transform {
    constructor();
    addChild(child: any): void;
    removeChild(child: any): void;
  }
}

