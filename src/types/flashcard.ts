export interface FlashcardData {
  front: string;
  back: string;
}

export interface FlashcardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface FlashcardDeckProps {
  cards: FlashcardData[];
  title?: string;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onExpand?: () => void;
  className?: string;
  showExpandButton?: boolean;
}

export interface FlashcardFullscreenProps {
  cards: FlashcardData[];
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}
