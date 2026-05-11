import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Box, Paper, Typography, IconButton, Avatar, Tooltip } from '@mui/material';
import { ContentCopy as CopyIcon, Person as UserIcon, SmartToy as BotIcon, Check as CheckIcon } from '@mui/icons-material';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 3,
        gap: 2
      }}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: 'secondary.main' }}>
          <BotIcon />
        </Avatar>
      )}

      <Paper
        elevation={1}
        sx={{
          p: { xs: 1.5, sm: 2 },
          maxWidth: { xs: '85%', sm: '80%' },
          backgroundColor: isUser ? '#e3f2fd' : '#ffffff',
          borderRadius: 2,
          position: 'relative',
          minWidth: { xs: '150px', sm: '200px' }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            {isUser ? '你' : 'AI'}
          </Typography>
          {!isStreaming && (
            <Tooltip title={copied ? "已复制!" : "复制内容"}>
              <IconButton size="small" onClick={handleCopy}>
                {copied ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{
          '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
          '& pre': { m: 0, mb: 1, borderRadius: 1, overflow: 'hidden' },
          '& code': { fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace' }
        }}>
          {isUser ? (
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.content}</Typography>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, '')}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                    />
                  ) : (
                    <code {...props} className={className} style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: 4 }}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </Box>
      </Paper>

      {isUser && (
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <UserIcon />
        </Avatar>
      )}
    </Box>
  );
};

export default MessageItem;
