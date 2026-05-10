import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  ChatBubbleOutline as ChatIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useChat } from '../context/ChatContext';
import ConfigPanel from './ConfigPanel';

const DRAWER_WIDTH = 280;

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onDrawerToggle }) => {
  const { sessions, currentSessionId, createNewSession, selectSession, deleteSession } = useChat();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => createNewSession()}
          sx={{ mt: 2, mb: 2, height: 48 }}
        >
          新聊天
        </Button>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {sessions.map((session) => (
          <ListItem
            key={session.id}
            disablePadding
            secondaryAction={
              <IconButton edge="end" aria-label="delete" size="small" onClick={(e) => {
                e.stopPropagation();
                setSessionToDelete(session.id);
                setIsDeleteDialogOpen(true);
              }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemButton
              selected={session.id === currentSessionId}
              onClick={() => {
                selectSession(session.id);
                if (isMobile) onDrawerToggle();
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ChatIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={session.title || '未命名聊天'}
                primaryTypographyProps={{
                  noWrap: true,
                  fontSize: '0.9rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
        {sessions.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center', opacity: 0.6 }}>
            <Typography variant="body2">无历史记录</Typography>
          </Box>
        )}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => setIsConfigOpen(true)}
          sx={{ height: 48 }}
        >
          设置
        </Button>
      </Box>
      <ConfigPanel open={isConfigOpen} onClose={() => setIsConfigOpen(false)} />



      {/* 删除对话二次确认弹窗 */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSessionToDelete(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ p: 3 }}>删除聊天</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>确定要删除这个聊天吗？此操作无法撤销。</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => {
            setIsDeleteDialogOpen(false);
            setSessionToDelete(null);
          }}>取消</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (sessionToDelete) {
                deleteSession(sessionToDelete);
              }
              setIsDeleteDialogOpen(false);
              setSessionToDelete(null);
            }}
          >
            确定删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
