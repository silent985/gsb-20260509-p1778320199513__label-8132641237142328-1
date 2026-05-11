import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, CircularProgress, Typography, Paper, Alert, Toolbar } from '@mui/material';
import { Send as SendIcon, Menu as MenuIcon } from '@mui/icons-material';
import { useChat } from '../context/ChatContext';
import MessageItem from './MessageItem';

interface ChatAreaProps {
  onDrawerToggle: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onDrawerToggle }) => {
  const {
    sessions,
    currentSessionId,
    sendMessage,
    isLoading,
    streamingContent,
    error,
    usage,
    config,
    hasValidUsage,
    clearError
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const content = inputValue;
    setInputValue('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      maxWidth: '100%',
      bgcolor: 'background.default'
    }}>
      {/* Mobile Header */}
      <Toolbar sx={{ display: { sm: 'none' }, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap component="div">
          {currentSession?.title || 'AI Chat'}
        </Typography>
      </Toolbar>

      {/* Messages Area */}
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            opacity: 0.5
          }}>
            <Typography variant="h4" gutterBottom>今天我能为您做些什么？</Typography>
            <Typography variant="body1">请在下方输入消息开始对话。</Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))
        )}

        {streamingContent && (
          <MessageItem
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              timestamp: Date.now()
            }}
            isStreaming={true}
          />
        )}

        {isLoading && !streamingContent && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 3, ml: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Error Banner */}
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mx: 2, mb: 1 }}>{error}</Alert>
      )}

      {/* Stats */}
      {!isLoading && hasValidUsage && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', alignItems: 'center', gap: { xs: 1, sm: 4 }, mb: 1, p: 1 }}>
          {usage.totalTime > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              响应耗时: {(usage.totalTime / 1000).toFixed(2)}s
            </Typography>
          )}
          {usage.totalTokens !== undefined && (
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Token 用量: {usage.totalTokens} / {config.maxTokens}
            </Typography>
          )}
        </Box>
      )}

      {/* Input Area */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 1, sm: 2 },
          bgcolor: 'background.paper',
          borderTop: '1px solid #e0e0e0',
          borderRadius: 0
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, mx: { xs: 1, sm: 2 } }}>
          <TextField
            fullWidth
            multiline
            maxRows={8}
            placeholder="输入消息..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                height: 'auto',
                minHeight: { xs: 80, sm: 200 },
                display: 'flex',
                alignItems: 'flex-start'
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            sx={{ alignSelf: 'center', mt: 1 }}
          >
            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.disabled' }}>
          AI 根据提供的模型生成回复。请查看配置了解详情。
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatArea;
