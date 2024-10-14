'use client';
import { useState, type ReactNode } from 'react';

import {
  DndContext,
  useDroppable,
  useDraggable,
  MouseSensor,
  useSensor,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import {
  Box,
  Select,
  SimpleGrid,
  IconButton,
  VStack,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { Webcam, GripVertical, LayoutGrid, Minus } from 'lucide-react';

import CameraFeed from '@/components/CameraFeed';

import { useScrollBlock } from '@/hooks/useScrollBlock';

const Droppable: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { setNodeRef, isOver, active, over } = useDroppable({ id });

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
      opacity={active && over ? 0.4 : 1}
      zIndex={active && over ? -1 : 1}
    >
      {children}
    </Box>
  );
};

const Draggable: React.FC<{
  id: string;
  stream: Stream;
  children: ReactNode;
}> = ({ id, stream, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled: !stream.online });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 0.1s ease',
    cursor: !stream.online ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      _disabled={{ opacity: 0.6 }}
    >
      {children}
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
  id: string;
  src: string;
  online: boolean;
  parent: string | null;
}

export default function DndPage() {
  const [blockScroll, allowScroll] = useScrollBlock();
  const [layout, setLayout] = useState<string>('1x1');

  const [streams, setStreams] = useState<Stream[]>([
    {
      id: '66d9df024bc6213f664c313f',
      src: 'https://mediaserver.plenus.cloud:8889/66d9df024bc6213f664c313f?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
      online: true,
      parent: null,
    },
    {
      id: '66e4a570290abf99143daa02',
      src: 'https://mediaserver.plenus.cloud:8889/66e4a570290abf99143daa02?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
      online: true,
      parent: null,
    },
    {
      id: '66d9de644bc64342346c3100',
      src: 'https://mediaserver.plenus.cloud:8889/66d9de644bc6213f664c3100?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
      online: false,
      parent: null,
    },
    {
      id: '66d9de644bc6213f664c3100',
      src: 'https://mediaserver.plenus.cloud:8889/66d9de644bc6213f664c3100?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
      online: true,
      parent: null,
    },
    {
      id: '66d9de644bc62142346c3100',
      src: 'https://mediaserver.plenus.cloud:8889/66d9de644bc6213f664c3100?controls=0&organization=66cf66e54b6bd6c5b6d5862f',
      online: false,
      parent: null,
    },
  ]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over) {
      const overItem = streams.find((stream) => stream.parent === over.id);
      if (overItem) {
        return;
      }
    }

    setStreams((streams: Stream[]) => {
      const updatedSteams = streams.map((stream) =>
        stream.id === active.id
          ? { ...stream, parent: over ? (over.id as string) : null }
          : stream,
      );

      return updatedSteams;
    });
  }

  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLayout(e.target.value);
  };

  const { columns, cameras } = layouts[layout];

  const sensor = useSensor(MouseSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const handleRemoveCamera = (stream: Stream) => {
    setStreams((streams) =>
      streams.map((s) => (s.id === stream.id ? { ...s, parent: null } : s)),
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={[sensor]}>
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
          <VStack align="stretch" mb={4}>
            <Text fontSize="xl">Lista de Câmeras</Text>

            <Text fontSize="10px" color="gray.500">
              Segure e arraste para um dos quadrados
            </Text>
          </VStack>

          <VStack align="stretch">
            {streams.map((stream, indexStream) =>
              stream.parent === null ? (
                <Draggable key={stream.id} id={stream.id} stream={stream}>
                  <HStack
                    justify="space-between"
                    p={2}
                    bg="white"
                    borderRadius="md"
                    boxShadow="md"
                    mb={2}
                    _disabled={{ opacity: 0.6 }}
                  >
                    <HStack spacing={2}>
                      <Webcam />
                      <Text>{`Câmera ${indexStream + 1}`}</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Badge colorScheme={stream.online ? 'green' : 'red'}>
                        {stream.online ? 'Online' : 'Offline'}
                      </Badge>
                      <GripVertical />
                    </HStack>
                  </HStack>
                </Draggable>
              ) : (
                <HStack
                  key={stream.id}
                  justify="space-between"
                  p={2}
                  bg="white"
                  borderRadius="md"
                  boxShadow="md"
                  mb={2}
                >
                  <HStack spacing={2}>
                    <Webcam />
                    <Text>{`Câmera ${indexStream + 1}`}</Text>
                  </HStack>
                  <IconButton
                    size="xs"
                    aria-label="Remover"
                    colorScheme="red"
                    onClick={() => handleRemoveCamera(stream)}
                  >
                    <Minus size={24} />
                  </IconButton>
                </HStack>
              ),
            )}
          </VStack>
        </Box>

        <Box flex="1" ml="250px" p={4}>
          <HStack mb={4} spacing={2}>
            <Select onChange={handleLayoutChange} maxW="250px">
              {Object.keys(layouts).map((key) => (
                <option key={key} value={key}>
                  {key} ({layouts[key].cameras}){' '}
                  {layouts[key].cameras > 1 ? 'câmeras' : 'câmera'}
                </option>
              ))}
            </Select>

            <LayoutGrid size={24} />
          </HStack>

          <SimpleGrid columns={columns} spacing={1} zIndex={0}>
            {Array.from({ length: cameras }).map((_, index) => (
              <Droppable key={index} id={`cell-${index}`}>
                <Box sx={{ flex: 1, width: '100%' }}>
                  {streams
                    .filter((stream) => stream.parent === `cell-${index}`)
                    .map((stream) => (
                      <Draggable key={stream.id} id={stream.id} stream={stream}>
                        <Box
                          sx={{
                            aspectRatio: 16 / 9,
                            width: '100%',
                          }}
                        >
                          <CameraFeed
                            src={stream.src}
                            label={stream.id}
                            id={stream.id}
                            parent={stream.parent}
                            handleRemoveCamera={handleRemoveCamera}
                            allowScroll={allowScroll}
                            blockScroll={blockScroll}
                            columnsLength={columns}
                          />
                        </Box>
                      </Draggable>
                    ))}
                  {streams.some(
                    (stream) => stream.parent === `cell-${index}`,
                  ) ? null : (
                    <Box
                      bg="gray.200"
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
                  )}
                </Box>
              </Droppable>
            ))}
          </SimpleGrid>
        </Box>
      </Box>
    </DndContext>
  );
}
