'use client';

import { useEffect, useRef } from 'react';
import './SleekLineCursor.css';

/**
 * Canvas cursor trail (Inspira/Cursify sleek-line style).
 * Hue cycles through violet → indigo → blue to match the /demo theme.
 */
export default function SleekLineCursor({
  friction = 0.5,
  trails = 20,
  size = 50,
  dampening = 0.25,
  tension = 0.98,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const config = { friction, trails, size, dampening, tension };
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lines = [];
    let running = true;
    let rafId = 0;

    /* Wave oscillator — blue with a soft violet lean (~210–255°) */
    const wave = {
      phase: Math.random() * Math.PI * 2,
      offset: 232,
      frequency: 0.0015,
      amplitude: 22,
      update() {
        this.phase += this.frequency;
        return this.offset + Math.sin(this.phase) * this.amplitude;
      },
    };

    function Node() {
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
    }

    function Line(spring) {
      this.spring = spring + 0.1 * Math.random() - 0.02;
      this.friction = config.friction + 0.01 * Math.random() - 0.002;
      this.nodes = [];
      for (let i = 0; i < config.size; i++) {
        const node = new Node();
        node.x = pos.x;
        node.y = pos.y;
        this.nodes.push(node);
      }
    }

    Line.prototype.update = function update() {
      let spring = this.spring;
      const head = this.nodes[0];
      head.vx += (pos.x - head.x) * spring;
      head.vy += (pos.y - head.y) * spring;

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        if (i > 0) {
          const prev = this.nodes[i - 1];
          node.vx += (prev.x - node.x) * spring;
          node.vy += (prev.y - node.y) * spring;
          node.vx += prev.vx * config.dampening;
          node.vy += prev.vy * config.dampening;
        }
        node.vx *= this.friction;
        node.vy *= this.friction;
        node.x += node.vx;
        node.y += node.vy;
        spring *= config.tension;
      }
    };

    Line.prototype.draw = function draw() {
      let x = this.nodes[0].x;
      let y = this.nodes[0].y;
      ctx.beginPath();
      ctx.moveTo(x, y);

      for (let i = 1, end = this.nodes.length - 2; i < end; i++) {
        const curr = this.nodes[i];
        const next = this.nodes[i + 1];
        x = 0.5 * (curr.x + next.x);
        y = 0.5 * (curr.y + next.y);
        ctx.quadraticCurveTo(curr.x, curr.y, x, y);
      }

      const secondLast = this.nodes[this.nodes.length - 2];
      const last = this.nodes[this.nodes.length - 1];
      ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
      ctx.stroke();
      ctx.closePath();
    };

    function initLines() {
      lines = [];
      for (let i = 0; i < config.trails; i++) {
        lines.push(new Line(0.4 + (i / config.trails) * 0.025));
      }
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function setPosFromEvent(e) {
      if (e.touches && e.touches.length) {
        pos.x = e.touches[0].clientX;
        pos.y = e.touches[0].clientY;
      } else {
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
    }

    function onFirstMove(e) {
      document.removeEventListener('mousemove', onFirstMove);
      document.removeEventListener('touchstart', onFirstMove);
      document.addEventListener('mousemove', setPosFromEvent);
      document.addEventListener('touchmove', setPosFromEvent, { passive: true });
      document.addEventListener('touchstart', setPosFromEvent, { passive: true });
      setPosFromEvent(e);
      initLines();
      render();
    }

    function onFocus() {
      if (!running) {
        running = true;
        render();
      }
    }

    function onBlur() {
      running = false;
    }

    function render() {
      if (!running) return;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `hsla(${Math.round(wave.update())}, 74%, 60%, 0.24)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < lines.length; i++) {
        lines[i].update();
        lines[i].draw();
      }

      rafId = window.requestAnimationFrame(render);
    }

    resize();
    document.addEventListener('mousemove', onFirstMove);
    document.addEventListener('touchstart', onFirstMove, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      running = false;
      window.cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onFirstMove);
      document.removeEventListener('touchstart', onFirstMove);
      document.removeEventListener('mousemove', setPosFromEvent);
      document.removeEventListener('touchmove', setPosFromEvent);
      document.removeEventListener('touchstart', setPosFromEvent);
      window.removeEventListener('resize', resize);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, [friction, trails, size, dampening, tension]);

  return (
    <canvas
      ref={canvasRef}
      className="sleek-line-cursor"
      aria-hidden="true"
    />
  );
}
