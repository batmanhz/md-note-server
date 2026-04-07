<template>
  <div class="file-tree">
    <div v-for="item in sortedItems" :key="item.path" class="tree-item">
      <div 
        class="tree-node" 
        :class="{ 'active': isActive(item), 'folder': item.type === 'folder' }"
        :style="{ paddingLeft: depth * 16 + 12 + 'px' }"
        @click="handleClick(item)"
      >
        <span class="icon">
          <svg v-if="item.type === 'folder'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line v-if="isExpanded(item)" x1="12" y1="11" x2="12" y2="17"></line>
            <line v-if="isExpanded(item)" x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
        </span>
        <span class="name">{{ item.name }}</span>
        
        <div class="actions" v-if="item.type === 'folder'">
          <button class="btn-icon" title="新建文件" @click.stop="emit('create', item.path, 'file')">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>
      
      <div v-if="item.type === 'folder' && isExpanded(item)" class="tree-children">
        <FileTree 
          :items="item.children" 
          :depth="depth + 1" 
          :active-path="activePath"
          @select="emit('select', $event)"
          @create="emit('create', $event.path, $event.type)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  depth: {
    type: Number,
    default: 0
  },
  activePath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select', 'create'])

const expandedPaths = ref(new Set())

const sortedItems = computed(() => {
  return [...props.items].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return a.name.localeCompare(b.name)
  })
})

function handleClick(item) {
  if (item.type === 'folder') {
    toggleExpand(item.path)
  } else {
    emit('select', item)
  }
}

function toggleExpand(path) {
  if (expandedPaths.value.has(path)) {
    expandedPaths.value.delete(path)
  } else {
    expandedPaths.value.add(path)
  }
}

function isExpanded(item) {
  return expandedPaths.value.has(item.path)
}

function isActive(item) {
  return props.activePath === item.path
}
</script>

<style scoped>
.file-tree {
  width: 100%;
}

.tree-node {
  display: flex;
  align-items: center;
  height: 32px;
  cursor: pointer;
  border-radius: 4px;
  margin: 1px 4px;
  color: var(--text-secondary);
  font-size: 13px;
  transition: all 0.1s;
  position: relative;
}

.tree-node:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.tree-node.active {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

.icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
  opacity: 0.7;
}

.name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: none;
  padding: 0 8px;
}

.tree-node:hover .actions {
  display: flex;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
}

.btn-icon:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}
</style>