/**
 * Latent — the interface layer for AI-native products.
 * Public entry point for the component library.
 */
import './tokens/tokens.css'
import './components/components.css'

export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'

export { PromptComposer, AttachButton } from './components/PromptComposer'
export type {
  PromptComposerProps,
  AttachButtonProps,
} from './components/PromptComposer'

export { StreamingReply } from './components/StreamingReply'
export type { StreamingReplyProps } from './components/StreamingReply'

export { ReasoningTrace } from './components/ReasoningTrace'
export type {
  ReasoningTraceProps,
  ReasoningStep,
} from './components/ReasoningTrace'

export { ToolCall } from './components/ToolCall'
export type { ToolCallProps, ToolState } from './components/ToolCall'

export { Citations } from './components/Citations'
export type { CitationsProps, Citation } from './components/Citations'

export { ModelPicker } from './components/ModelPicker'
export type { ModelPickerProps, ModelOption } from './components/ModelPicker'

export { TokenMeter } from './components/TokenMeter'
export type { TokenMeterProps } from './components/TokenMeter'

export { AgentTimeline } from './components/AgentTimeline'
export type {
  AgentTimelineProps,
  TimelineStep,
  StepStatus,
} from './components/AgentTimeline'

export { DiffSuggestion } from './components/DiffSuggestion'
export type { DiffSuggestionProps, DiffLine } from './components/DiffSuggestion'

export { CommandPalette, useCommandPalette } from './components/CommandPalette'
export type { CommandPaletteProps, Command } from './components/CommandPalette'

export { Guardrail } from './components/Guardrail'
export type { GuardrailProps } from './components/Guardrail'

export { Feedback } from './components/Feedback'
export type { FeedbackProps, Rating } from './components/Feedback'

export { ConversationThread, Message } from './components/ConversationThread'
export type {
  ConversationThreadProps,
  MessageProps,
} from './components/ConversationThread'

export { useTheme } from './hooks/useTheme'
export type { Theme } from './hooks/useTheme'

export { cn } from './utils/cn'
