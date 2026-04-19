export interface VFSPosition {
  x: number;
  y: number;
}

export interface VFSMetadata {
  icon?: string;
  iconPosition?: VFSPosition;
  appId?: string;
  [key: string]: unknown;
}

export interface VFSNode {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: VFSNode[];
  content?: string;
  metadata?: VFSMetadata;
}

export interface VirtualFSApi {
  createFile(path: string, name: string, content?: string): void;
  createFolder(path: string, name: string): void;
  deleteNode(path: string): void;
  readFile(path: string): string | undefined;
  listFolder(path: string): VFSNode[];
}

const splitPath = (path: string): string[] =>
  path
    .trim()
    .split("/")
    .filter((segment) => segment.length > 0);

const cloneNode = (node: VFSNode): VFSNode => ({
  ...node,
  metadata: node.metadata ? { ...node.metadata } : undefined,
  children: node.children?.map(cloneNode),
});

export class VirtualFS implements VirtualFSApi {
  root: VFSNode = {
    id: "root",
    name: "/",
    type: "folder",
    children: [],
  };

  constructor(initialRoot?: VFSNode) {
    if (initialRoot) {
      this.root = cloneNode(initialRoot);
    }
  }

  createFile(path: string, name: string, content = ""): void {
    const folder = this.resolveFolder(path);
    this.assertNameAvailable(folder, name);

    folder.children ??= [];
    folder.children.push({
      id: crypto.randomUUID(),
      name,
      type: "file",
      content,
    });
  }

  createFolder(path: string, name: string): void {
    const folder = this.resolveFolder(path);
    this.assertNameAvailable(folder, name);

    folder.children ??= [];
    folder.children.push({
      id: crypto.randomUUID(),
      name,
      type: "folder",
      children: [],
    });
  }

  deleteNode(path: string): void {
    const tokens = splitPath(path);

    if (tokens.length === 0) {
      throw new Error("Cannot delete root folder.");
    }

    const parentPath = `/${tokens.slice(0, -1).join("/")}`;
    const nodeName = tokens[tokens.length - 1];
    const parent = this.resolveFolder(parentPath === "/" ? "/" : parentPath);

    const children = parent.children ?? [];
    const index = children.findIndex((node) => node.name === nodeName);

    if (index < 0) {
      throw new Error(`Node '${path}' was not found.`);
    }

    children.splice(index, 1);
  }

  readFile(path: string): string | undefined {
    const node = this.resolveNode(path);

    if (!node || node.type !== "file") {
      return undefined;
    }

    return node.content;
  }

  listFolder(path: string): VFSNode[] {
    const folder = this.resolveFolder(path);
    return (folder.children ?? []).map(cloneNode);
  }

  getNode(path: string): VFSNode | undefined {
    return this.resolveNode(path);
  }

  updateNode(path: string, updater: (node: VFSNode) => void): void {
    const node = this.resolveNode(path);

    if (!node) {
      throw new Error(`Node '${path}' was not found.`);
    }

    updater(node);
  }

  replaceRoot(nextRoot: VFSNode): void {
    this.root.id = nextRoot.id;
    this.root.name = nextRoot.name;
    this.root.type = nextRoot.type;
    this.root.content = nextRoot.content;
    this.root.metadata = nextRoot.metadata ? { ...nextRoot.metadata } : undefined;
    this.root.children = nextRoot.children?.map(cloneNode);
  }

  private resolveNode(path: string): VFSNode | undefined {
    const tokens = splitPath(path);

    if (tokens.length === 0) {
      return this.root;
    }

    let current: VFSNode | undefined = this.root;

    for (const token of tokens) {
      if (!current || current.type !== "folder") {
        return undefined;
      }

      current = (current.children ?? []).find((child) => child.name === token);
    }

    return current;
  }

  private resolveFolder(path: string): VFSNode {
    const node = this.resolveNode(path);

    if (!node || node.type !== "folder") {
      throw new Error(`Folder '${path}' was not found.`);
    }

    return node;
  }

  private assertNameAvailable(folder: VFSNode, name: string): void {
    if ((folder.children ?? []).some((node) => node.name === name)) {
      throw new Error(`A node named '${name}' already exists in '${folder.name}'.`);
    }
  }
}
