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
  Camera,
  Fullscreen,
  Menu,
  Webcam,
} from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm, Controller } from 'react-hook-form';

interface CameraFeedProps {
  src: string;
  label: string;
  id: number;
  status: boolean;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ src, label, id, status }) => {
  const [scale, setScale] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 1));

  const captureFrame = () => {
    const iframe = iframeRef.current;

    if (iframe) {
      const iframeWindow = iframe.contentWindow;

      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = iframe.clientWidth;
        canvas.height = iframe.clientHeight;

        if (context) {
          context.drawImage(
            iframeWindow as unknown as HTMLCanvasElement,
            0,
            0,
            canvas.width,
            canvas.height,
          );

          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `${label}-capture.png`;
          link.click();
        }
      } catch (error) {
        console.error(
          'Falha ao capturar o frame do iframe. Verifique se o conteúdo é do mesmo domínio.',
          error,
        );
      }
    }
  };

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
          aria-label="Capture Frame"
          icon={<Camera />}
          size="sm"
          onClick={captureFrame}
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

const SortableItem: React.FC<{ id: number; stream: Stream }> = ({
  id,
  stream,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    >
      <Text>{`Câmera ${id}`}</Text>
      <Badge colorScheme={stream.online ? 'green' : 'red'}>
        {stream.online ? 'Online' : 'Offline'}
      </Badge>
    </HStack>
  );
};

export default function Grid() {
  const [layout, setLayout] = useState<string>('1x1');
  const [streams, setStreams] = useState<Stream[]>([
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
  ]);
  const [gridStreams, setGridStreams] = useState<Stream[]>([]);

  const { control } = useForm();

  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLayout(e.target.value);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && over.id.startsWith('grid-')) {
      const draggedStream = streams.find((stream) => stream.id === active.id);
      if (draggedStream && draggedStream.online) {
        setGridStreams((prev) => {
          const newGridStreams = [...prev];
          const gridIndex = parseInt(over.id.split('-')[1], 10);
          newGridStreams[gridIndex] = draggedStream;
          return newGridStreams;
        });
        setStreams((prev) => prev.filter((stream) => stream.id !== active.id));
      }
    } else if (active.id !== over.id) {
      setStreams((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const { columns, cameras } = layouts[layout];

  return (
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
        overflowY="auto"
      >
        <Text fontSize="xl" mb={4}>
          Lista de Câmeras
        </Text>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={streams}
            strategy={verticalListSortingStrategy}
          >
            <VStack align="stretch">
              {streams.map((stream) => (
                <SortableItem key={stream.id} id={stream.id} stream={stream} />
              ))}
            </VStack>
          </SortableContext>
        </DndContext>
      </Box>

      <Box flex="1" ml="250px" p={4}>
        <Select mb={4} onChange={handleLayoutChange}>
          {Object.keys(layouts).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </Select>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={gridStreams}
            strategy={verticalListSortingStrategy}
          >
            <SimpleGrid columns={columns} spacing={2}>
              {Array.from({ length: cameras }).map((_, index) => (
                <Box
                  key={index}
                  id={`grid-${index}`}
                  borderWidth="1px"
                  borderRadius="md"
                  height="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {gridStreams[index] ? (
                    <CameraFeed
                      key={gridStreams[index].id}
                      src={gridStreams[index].src}
                      label={`Câmera ${index + 1}`}
                      id={gridStreams[index].id}
                      status={gridStreams[index].online}
                    />
                  ) : (
                    <AspectRatio ratio={16 / 9} width="100%">
                      <Box
                        bg="gray.200"
                        borderRadius="md"
                        p={4}
                        sx={{ border: '3px dashed #ccc' }}
                      >
                        <VStack spacing={2}>
                          <Webcam
                            size={Math.max(24, 128 / columns)}
                            strokeWidth={2}
                            style={{
                              color: '#223e91',
                            }}
                          />

                          <Text
                            fontSize="sm"
                            textAlign="center"
                            color="gray.500"
                          >
                            Arraste uma câmera aqui
                          </Text>
                        </VStack>
                      </Box>
                    </AspectRatio>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          </SortableContext>
        </DndContext>
      </Box>
    </Box>
  );
}
