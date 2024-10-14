'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Select,
  SimpleGrid,
  AspectRatio,
  IconButton,
  VStack,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import {
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Webcam,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import { CSS } from '@dnd-kit/utilities';

interface CameraFeedProps {
  src: string;
  label: string;
  id?: number;
  status?: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ src, label }) => {
  const [scale, setScale] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 1));

  const toggleFullscreen = () => {
    const iframe = iframeRef.current;

    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        iframe.requestFullscreen();
      }
    }
  };

  const [zoomInterval, setZoomInterval] = useState<NodeJS.Timeout | null>(null);

  const startZoomIn = () => {
    if (zoomInterval) return;
    const interval = setInterval(zoomIn, 100);
    setZoomInterval(interval);
  };

  const startZoomOut = () => {
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

  return (
    <Box position="relative" width="100%">
      <AspectRatio
        ratio={16 / 9}
        bg="gray.800"
        borderWidth="1px"
        borderRadius="md"
        overflow="hidden"
      >
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

      <VStack
        spacing={2}
        display={{ base: 'none', md: 'flex' }}
        position="absolute"
        bottom="10px"
        right="10px"
        zIndex="1"
      >
        <IconButton
          aria-label="Zoom In"
          icon={<ZoomIn />}
          size="sm"
          onMouseDown={startZoomIn}
          onMouseUp={stopZoom}
          onMouseLeave={stopZoom}
        />
        <IconButton
          aria-label="Zoom Out"
          icon={<ZoomOut />}
          size="sm"
          onMouseDown={startZoomOut}
          onMouseUp={stopZoom}
          onMouseLeave={stopZoom}
        />
        <IconButton
          aria-label="Toggle Fullscreen"
          icon={<Fullscreen />}
          size="sm"
          onClick={toggleFullscreen}
        />
      </VStack>
    </Box>
  );
};

interface LayoutConfig {
  columns: number;
  cameras: number;
}

const layouts: Record<string, LayoutConfig> = {
  '1x1': { columns: 1, cameras: 1 },
  '2x1': { columns: 2, cameras: 2 },
  '2x2': { columns: 2, cameras: 4 },
  '3x2': { columns: 3, cameras: 6 },
  '3x3': { columns: 3, cameras: 9 },
  '4x4': { columns: 4, cameras: 16 },
};

interface Stream {
  id: number;
  src: string;
  online: boolean;
}

const DraggableItem: React.FC<{ id: number; stream: Stream }> = ({
  id,
  stream,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: !stream.online });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 0.1s ease',
    cursor: !stream.online ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
  };

  return (
    <HStack
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      justify="space-between"
      p={2}
      bg="white"
      borderRadius="md"
      boxShadow="md"
      mb={2}
      _disabled={{ opacity: 0.6 }}
    >
      <Text>{`Câmera ${id}`}</Text>
      <HStack spacing={2}>
        <Badge colorScheme={stream.online ? 'green' : 'red'}>
          {stream.online ? 'Online' : 'Offline'}
        </Badge>
        <GripVertical />
      </HStack>
    </HStack>
  );
};

const DroppableGridCell: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const style = {
    border: isOver ? '2px dashed #333' : '2px dashed transparent',
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      borderWidth="1px"
      borderRadius="md"
      height="100%"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {children}
    </Box>
  );
};

const streams: Stream[] = [
  {
    id: 1,
    src: 'https://mediaserver.plenus.cloud:8889/66d9df024bc6213f664c313f?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
    online: true,
  },
  {
    id: 2,
    src: 'https://mediaserver.plenus.cloud:8889/66e4a570290abf99143daa02?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
    online: true,
  },
  {
    id: 3,
    src: 'https://mediaserver.plenus.cloud:8889/66d9de644bc6213f664c3100?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
    online: false,
  },
];

export default function Grid() {
  const [layout, setLayout] = useState<string>('1x1');

  const [gridStreams, setGridStreams] = useState<(Stream | null)[]>([]);

  // const { control } = useForm();
  // const { fields, move, update, replace, insert, swap, remove } = useFieldArray(
  //   {
  //     control,
  //     name: 'streams',
  //   },
  // );

  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLayout(e.target.value);
    setGridStreams(Array(layouts[e.target.value].cameras).fill(null));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
  };

  const { columns, cameras } = layouts[layout];

  return (
    <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <Box p={4} display="flex">
        <Box
          width="250px"
          bg="gray.300"
          p={4}
          boxShadow="md"
          position="fixed"
          left="0"
          top="0"
          bottom="0"
        >
          <Text fontSize="xl" mb={4}>
            Lista de Câmeras
          </Text>

          <VStack align="stretch">
            {streams.map((stream) => (
              <DraggableItem key={stream.id} id={stream.id} stream={stream} />
            ))}
          </VStack>
        </Box>

        <Box flex="1" ml="250px" p={4}>
          <Select mb={4} onChange={handleLayoutChange}>
            {Object.keys(layouts).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </Select>

          <SimpleGrid columns={columns} spacing={2} zIndex={0}>
            {Array.from({ length: cameras }).map((_, index) => (
              <DroppableGridCell key={index} id={`cell-${index}`}>
                <Box
                  bg="gray.200"
                  borderRadius="md"
                  p={4}
                  sx={{
                    aspectRatio: 16 / 9,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VStack spacing={2}>
                    <Webcam
                      size={Math.max(24, 128 / columns)}
                      strokeWidth={2}
                      style={{
                        color: '#223e91',
                      }}
                    />

                    <Text fontSize="sm" textAlign="center" color="gray.500">
                      Arraste uma câmera aqui
                    </Text>
                  </VStack>
                </Box>
              </DroppableGridCell>
            ))}
          </SimpleGrid>
        </Box>
      </Box>
    </DndContext>
  );
}
