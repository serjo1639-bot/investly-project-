/** components/index.js — single import surface for the UI kit. */

// Primitives
export { Text } from './ui/Text';
export { Button } from './ui/Button';
export { Input } from './ui/Input';
export { Card } from './ui/Card';
export { Badge } from './ui/Badge';
export { Avatar } from './ui/Avatar';
export { Chip } from './ui/Chip';
export { Divider } from './ui/Divider';
export { ProgressBar } from './ui/ProgressBar';
export { IconButton } from './ui/IconButton';
export { Logo } from './ui/Logo';
export { PressableScale } from './ui/PressableScale';
export { HeroBackground } from './ui/HeroBackground';

// Feedback
export { Skeleton, SkeletonText, SkeletonCard } from './feedback/Skeleton';
export { EmptyState } from './feedback/EmptyState';
export { ErrorState } from './feedback/ErrorState';
export { Spinner } from './feedback/Spinner';
export { ToastProvider, useToast, toast } from './feedback/Toast';

// Composite building blocks
export { SectionHeader } from './ui/SectionHeader';
export { StatTile } from './ui/StatTile';
export { ListRow } from './ui/ListRow';
export { ProjectCard } from './project/ProjectCard';
export { FundingProgress } from './project/FundingProgress';
