import React, { useState, useRef } from 'react';
import {
  Box,
  AspectRatio,
  Button,
  VStack,
  IconButton,
  HStack,
  Text,
} from '@chakra-ui/react';
import {
  ZoomIn,
  ZoomOut,
  Fullscreen,
  GripVertical,
  CircleX,
} from 'lucide-react';

interface Stream {
  id: string;
  src: string;
  online: boolean;
  parent: string | null;
}

interface CameraFeedProps {
  src: string;
  label: string;
  id: string;
  status?: boolean;
  parent?: string | null;
  columnsLength: number;
  handleRemoveCamera: (stream: Stream) => void;
  allowScroll: () => void;
  blockScroll: () => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({
  src,
  label,
  id,
  // parent,
  columnsLength,
  handleRemoveCamera,
  allowScroll,
  blockScroll,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [zoomInterval, setZoomInterval] = useState<NodeJS.Timeout | null>(null);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 1));

  const toggleFullscreen = (event: React.MouseEvent) => {
    event.stopPropagation();
    const iframe = iframeRef.current;

    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        iframe.requestFullscreen();
      }
    }
  };

  const startZoomIn = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (zoomInterval) return;
    const interval = setInterval(zoomIn, 100);
    setZoomInterval(interval);
  };

  const startZoomOut = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (zoomInterval) return;
    const interval = setInterval(zoomOut, 100);
    setZoomInterval(interval);
  };

  const stopZoom = () => {
    if (zoomInterval) {
      clearInterval(zoomInterval);
      setZoomInterval(null);
    }
  };

  // const handleMouseDown = (event: React.MouseEvent) => {
  //   event.stopPropagation();
  // };

  const handleWheel = (event: React.WheelEvent) => {
    const iframe = iframeRef.current;
    if (iframe) {
      const rect = iframe.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const originX = (offsetX / rect.width) * 100;
      const originY = (offsetY / rect.height) * 100;
      iframe.style.transformOrigin = `${originX}% ${originY}%`;

      if (event.deltaY > 0) {
        zoomOut();
      } else {
        zoomIn();
      }
    }
  };

  const getButtonSize = () => {
    if (columnsLength <= 2) {
      return 'md';
    } else if (columnsLength <= 3) {
      return 'sm';
    } else {
      return 'xs';
    }
  };

  return (
    <Box
      position="relative"
      width="100%"
      onMouseEnter={() => {
        setIsHovered(true);
        blockScroll();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        allowScroll();
        setScale(1);
      }}
      onDoubleClick={toggleFullscreen}
      onWheel={handleWheel}
    >
      <AspectRatio ratio={16 / 9} overflow="hidden">
        <iframe
          ref={iframeRef}
          src={src}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            width: '100%',
            height: '100%',
            border: 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </AspectRatio>

      {isHovered && (
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          bg="rgba(0, 0, 0, 0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          opacity="0.6"
          sx={{ transition: 'opacity 0.2s ease' }}
        >
          <Button
            size={getButtonSize()}
            colorScheme="whiteAlpha"
            opacity="0.8"
            sx={{
              transition: 'opacity 0.2s ease',
              cursor: 'grabbing',
              _hover: {
                opacity: 1,
              },
            }}
          >
            <HStack spacing={2}>
              <GripVertical size={Math.max(24, 40 / columnsLength)} />
              <Text color="white">Segure e arraste para mover</Text>
            </HStack>
          </Button>
        </Box>
      )}

      {isHovered && (
        <>
          <VStack
            spacing={2}
            position="absolute"
            top="10px"
            right="10px"
            zIndex="1"
          >
            <IconButton
              aria-label="Remover"
              icon={<CircleX size={Math.max(20, 40 / columnsLength)} />}
              color="gray.100"
              variant="link"
              size={getButtonSize()}
              onClick={() =>
                handleRemoveCamera({ id, src: src, online: true, parent: null })
              }
            />
          </VStack>

          <VStack
            spacing={2}
            position="absolute"
            bottom="10px"
            right="10px"
            zIndex="1"
          >
            <IconButton
              aria-label="Zoom In"
              icon={<ZoomIn size={Math.max(20, 40 / columnsLength)} />}
              size={getButtonSize()}
              onMouseDown={startZoomIn}
              onMouseUp={stopZoom}
              onMouseLeave={stopZoom}
            />
            <IconButton
              aria-label="Zoom Out"
              icon={<ZoomOut size={Math.max(20, 40 / columnsLength)} />}
              size={getButtonSize()}
              onMouseDown={startZoomOut}
              onMouseUp={stopZoom}
              onMouseLeave={stopZoom}
            />
            <IconButton
              aria-label="Toggle Fullscreen"
              icon={<Fullscreen size={Math.max(20, 40 / columnsLength)} />}
              size={getButtonSize()}
              onClick={toggleFullscreen}
              onMouseDown={(event) => event.stopPropagation()}
              onMouseUp={(event) => event.stopPropagation()}
            />
          </VStack>
        </>
      )}
    </Box>
  );
};

export default CameraFeed;
