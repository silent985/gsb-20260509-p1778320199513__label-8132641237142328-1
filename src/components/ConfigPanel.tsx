import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Slider
} from '@mui/material';
import { useChat } from '../context/ChatContext';

interface ConfigPanelProps {
  open: boolean;
  onClose: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ open, onClose }) => {
  const { config, setConfig } = useChat();

  const handleChange = (key: string, value: any) => {
    setConfig({ [key]: value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>配置</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <TextField
            label="API 密钥"
            type="password"
            fullWidth
            value={config.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            helperText="您的 API 密钥将存储在浏览器本地。"
          />

          <TextField
            label="基础 URL"
            fullWidth
            value={config.baseUrl}
            onChange={(e) => handleChange('baseUrl', e.target.value)}
            placeholder="https://api.siliconflow.cn/v1"
            helperText="OpenAI 兼容 API 的端点（例如 SiliconFlow）"
          />

          <TextField
            label="模型"
            fullWidth
            value={config.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="deepseek-ai/DeepSeek-V2.5"
            helperText="平台上的模型 ID"
          />

          <Box>
            <Typography gutterBottom>温度: {config.temperature}</Typography>
            <Slider
              value={config.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(_, val) => handleChange('temperature', val)}
              valueLabelDisplay="auto"
            />
            <Typography variant="caption" color="text.secondary">
              值越高，输出越随机；值越低，输出越确定。
            </Typography>
          </Box>

          <Box>
            <Typography gutterBottom>最大 Token: {config.maxTokens}</Typography>
            <Slider
              value={config.maxTokens}
              min={100}
              max={8000}
              step={100}
              onChange={(_, val) => handleChange('maxTokens', val)}
              valueLabelDisplay="auto"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigPanel;
