/// <reference path="types.d.ts" />

import * as shaderGenerator from './shaderGenerator';

import { Buffer, Geometry, Shader, Program } from '@pixi/core';
import { Matrix } from '@pixi/math';

let rectShaderFrag = `
varying vec2 vTextureCoord;
varying vec4 vFrame;
varying float vTextureId;
uniform vec4 shadowColor;
uniform sampler2D uSamplers[%count%];
uniform vec2 uSamplerSize[%count%];

void main(void){
   vec2 textureCoord = clamp(vTextureCoord, vFrame.xy, vFrame.zw);
   float textureId = floor(vTextureId + 0.5);

   vec4 color;
   %forloop%
   gl_FragColor = color;
}
`;
let rectShaderVert = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aFrame;
attribute vec2 aAnim;
attribute float aTextureId;

uniform mat3 projTransMatrix;
uniform vec2 animationFrame;

varying vec2 vTextureCoord;
varying float vTextureId;
varying vec4 vFrame;

void main(void){
   gl_Position = vec4((projTransMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
   vec2 animCount = floor((aAnim + 0.5) / 2048.0);
   vec2 animFrameOffset = aAnim - animCount * 2048.0;
   vec2 animOffset = animFrameOffset * floor(mod(animationFrame + 0.5, animCount));

   vTextureCoord = aTextureCoord + animOffset;
   vFrame = aFrame + vec4(animOffset, animOffset);
   vTextureId = aTextureId;
}
`;

export abstract class TilemapShader extends Shader {
  maxTextures = 0;

  constructor(maxTextures: number, shaderVert: string, shaderFrag: string) {
    super(new Program(shaderVert, shaderFrag), {
      animationFrame: new Float32Array(2),
      uSamplers: [],
      uSamplerSize: [],
      projTransMatrix: new Matrix(),
    });
    this.maxTextures = maxTextures;
    shaderGenerator.fillSamplers(this, this.maxTextures);
  }
}

export class RectTileShader extends TilemapShader {
  constructor(maxTextures: number) {
    super(
      maxTextures,
      rectShaderVert,
      shaderGenerator.generateFragmentSrc(maxTextures, rectShaderFrag)
    );
    shaderGenerator.fillSamplers(this, this.maxTextures);
  }
}

export class RectTileGeom extends Geometry {
  vertSize = 11;
  vertPerQuad = 4;
  stride = this.vertSize * 4;
  lastTimeAccess = 0;

  constructor() {
    super();
    const buf = (this.buf = new Buffer(new Float32Array(2), true, false));
    this.addAttribute('aVertexPosition', buf, 0, false, 0, this.stride, 0)
      .addAttribute('aTextureCoord', buf, 0, false, 0, this.stride, 2 * 4)
      .addAttribute('aFrame', buf, 0, false, 0, this.stride, 4 * 4)
      .addAttribute('aAnim', buf, 0, false, 0, this.stride, 8 * 4)
      .addAttribute('aTextureId', buf, 0, false, 0, this.stride, 10 * 4);
  }

  buf: Buffer;
}
