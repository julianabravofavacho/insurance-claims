import { useState } from 'react'
import {
  ActionIcon,
  Avatar,
  Burger,
  Drawer,
  Group,
  Menu,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core'
import {
  IconDashboard,
  IconFileText,
  IconLock,
  IconLogout,
  IconMoon,
  IconShieldCheck,
  IconSun,
  IconUser,
} from '@tabler/icons-react'

const navigationItems = [
  { value: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { value: 'claims', label: 'Sinistros', icon: IconFileText },
  { value: 'profile', label: 'Meu Perfil', icon: IconUser },
]

const pageTitles = {
  dashboard: 'Dashboard',
  claims: 'Gestão de Sinistros',
  profile: 'Meu Perfil',
}

export function AppShellLayout({ user, currentPage, onNavigate, onLogout, children }) {
  const [mobileOpened, setMobileOpened] = useState(false)
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  function handleNavigate(page) {
    onNavigate(page)
    setMobileOpened(false)
  }

  function toggleColorScheme() {
    setColorScheme(isDark ? 'light' : 'dark')
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <SidebarContent currentPage={currentPage} onNavigate={handleNavigate} />
      </aside>

      <Drawer
        opened={mobileOpened}
        onClose={() => setMobileOpened(false)}
        title="Insurance Claims"
        size={280}
        hiddenFrom="md"
      >
        <SidebarContent currentPage={currentPage} onNavigate={handleNavigate} />
      </Drawer>

      <div className="app-main">
        <header className="app-topbar">
          <Group gap="md" wrap="nowrap">
            <Burger opened={mobileOpened} onClick={() => setMobileOpened((value) => !value)} hiddenFrom="md" />
            <Stack gap={0}>
              <Text size="xs" fw={800} tt="uppercase" c="dimmed" lts={0.8}>
                Insurance Claims
              </Text>
              <Text component="strong" size="lg">
                {pageTitles[currentPage] ?? 'Insurance Claims'}
              </Text>
            </Stack>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Tooltip label={isDark ? 'Tema claro' : 'Tema escuro'}>
              <ActionIcon
                aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
                onClick={toggleColorScheme}
                radius="xl"
                size="lg"
                variant="light"
              >
                {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>

            <UserMenu user={user} onNavigate={handleNavigate} onLogout={onLogout} />
          </Group>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}

function SidebarContent({ currentPage, onNavigate }) {
  return (
    <Stack className="sidebar-content" gap="xl">
      <Stack gap={4}>
        <Group gap="sm" wrap="nowrap">
          <div className="brand-mark">
            <IconShieldCheck size={24} />
          </div>
          <Stack gap={0}>
            <Text size="xs" fw={900} tt="uppercase" lts={1} c="blue.6">
              Insurance
            </Text>
            <Text component="strong" size="lg">
              Claims
            </Text>
          </Stack>
        </Group>
        <Text size="sm" c="dimmed">
          Gestão de sinistros corporativa
        </Text>
      </Stack>

      <Stack gap="xs">
        {navigationItems.map((item) => (
          <SidebarItem
            key={item.value}
            item={item}
            active={currentPage === item.value}
            onClick={() => onNavigate(item.value)}
          />
        ))}
      </Stack>
    </Stack>
  )
}

function SidebarItem({ item, active, onClick }) {
  const Icon = item.icon

  return (
    <UnstyledButton className="sidebar-item" data-active={active || undefined} onClick={onClick}>
      <Group gap="sm" wrap="nowrap">
        <Icon size={20} />
        <Text fw={700}>{item.label}</Text>
      </Group>
    </UnstyledButton>
  )
}

function UserMenu({ user, onNavigate, onLogout }) {
  const initials = getInitials(user)

  return (
    <Menu width={260} position="bottom-end" shadow="lg">
      <Menu.Target>
        <UnstyledButton className="user-button" aria-label="Abrir menu do usuário">
          <Group gap="sm" wrap="nowrap">
            <Avatar color="blue" radius="xl">
              {initials}
            </Avatar>
            <Stack className="topbar-user" gap={0}>
              <Text size="sm" fw={800} truncate>
                {user?.name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {user?.email}
              </Text>
            </Stack>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Stack gap={2}>
            <Text fw={800}>{user?.name}</Text>
            <Text size="xs" c="dimmed">
              {user?.email}
            </Text>
          </Stack>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLock size={16} />} onClick={() => onNavigate('profile')}>
          Meu Perfil
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={onLogout}>
          Sair
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function getInitials(user) {
  const source = user?.name || user?.email || 'Usuário'
  const parts = source.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}
