import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useRef, useState } from "react";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import { useSlider } from "./hooks/useSlider";
import { MathUtils, MirroredRepeatWrapping } from "three";
import { useSpring } from "motion/react";

const PUSH_FORCE = 1.4;

const ImageSliderMaterial = shaderMaterial(
  {
    uTexture: undefined,
    uPrevTexture: undefined,
    uDispTexture: undefined,
    uProgress: 1.0,
    uDirection: 1,
    uPushForce: PUSH_FORCE,
    uMousePosition: [0, 0],
  },
  vertex,
  fragment
);

extend({ ImageSliderMaterial });

const ImageSlider = ({ width = 3, height = 4, fillPercent = 0.75 }) => {
  const viewport = useThree((state) => state.viewport);
  let ratio = viewport.height / (height / fillPercent);
  if (viewport.width < viewport.height) {
    ratio = viewport.width / (width / fillPercent);
  }

  const { items, curSlide, direction } = useSlider();
  const image = items[curSlide].image;
  const texture = useTexture(image);
  const [lastImage, setLastImage] = useState(image);
  const prevTexture = useTexture(lastImage);
  const material = useRef();
  const hovered = useRef(false);
  const [transition, setTransition] = useState(false);
  const dispTexture = useTexture("./img.avif");

  const progression = useSpring(0, { stiffness: 1500, damping: 250, mass: 2 });

  useEffect(() => {
    const newImage = image;
    material.current.uProgress = 0;
    progression.setCurrent(0);
    progression.set(1.0);
    material.current.uMousePosition = [direction === "prev" ? -1 : 1, 0];
    setTransition(true);
    const timeout = setTimeout(() => {
      setTransition(false);
    }, 1600);

    return () => {
      setLastImage(newImage);
      clearTimeout(timeout);
    };
  }, [image]);

  useFrame(({ mouse }) => {
    // material.current.uProgress = MathUtils.lerp(
    //   material.current.uProgress,
    //   1,
    //   0.05
    // );

    material.current.uProgress = progression.get();

    material.current.uMousePosition = [
      MathUtils.lerp(
        material.current.uMousePosition[0],
        transition
          ? (direction === "prev" ? 1.0 : -1.0) * material.current.uProgress
          : mouse.x,
        0.05
      ),
      MathUtils.lerp(
        material.current.uMousePosition[1],
        transition ? -1.0 * material.current.uProgress : mouse.y,
        0.05
      ),
    ];

    material.current.uPushForce = MathUtils.lerp(
      material.current.uPushForce,
      transition
        ? -PUSH_FORCE * 1.52 * Math.sin(material.current.uProgress * Math.PI)
        : hovered.current
        ? PUSH_FORCE
        : 0,
      0.05
    );
  });

  useSlider.getState().items.forEach((item) => {
    useTexture.preload(item.image);
  });
  texture.wrapS =
    texture.wrapT =
    prevTexture.wrapS =
    prevTexture.wrapT =
      MirroredRepeatWrapping;

  return (
    <mesh
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      <planeGeometry args={[width * ratio, height * ratio, 64, 64]} />
      <imageSliderMaterial
        ref={material}
        uTexture={texture}
        uPrevTexture={prevTexture}
        uDirection={direction === "next" ? 1 : -1}
        uDispTexture={dispTexture}
        transparent
      />
    </mesh>
  );
};

useTexture.preload("./img.avif");

export default ImageSlider;
