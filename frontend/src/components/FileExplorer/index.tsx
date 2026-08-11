import { FileOutlined } from '@ant-design/icons';
import type { ChangeType, DiffFile } from '../../types/review';
import './style.css';

interface FileExplorerProps {
  files: DiffFile[];
  selectedFilePath: string;
  onSelect: (filePath: string) => void;
}

const changeLabels: Record<ChangeType, string> = {
  added: 'A', modified: 'M', deleted: 'D', renamed: 'R',
};

export function FileExplorer({ files, selectedFilePath, onSelect }: FileExplorerProps) {
  return (
    <aside className="file-explorer" aria-label="变更文件">
      <div className="panel-heading">
        <div><strong>Changed files</strong><span>{files.length} 个文件</span></div>
      </div>
      <div className="file-explorer__list">
        {files.map((file) => {
          const splitAt = file.filePath.lastIndexOf('/');
          const directory = splitAt >= 0 ? file.filePath.slice(0, splitAt + 1) : '';
          const name = splitAt >= 0 ? file.filePath.slice(splitAt + 1) : file.filePath;
          return (
            <button
              key={file.filePath}
              type="button"
              className={`file-row${selectedFilePath === file.filePath ? ' file-row--active' : ''}`}
              onClick={() => onSelect(file.filePath)}
              title={file.filePath}
            >
              <span className={`file-row__status file-row__status--${file.changeType}`}>{changeLabels[file.changeType]}</span>
              <FileOutlined className="file-row__icon" />
              <span className="file-row__path"><span>{directory}</span><strong>{name}</strong></span>
              <span className="file-row__stats"><b>+{file.additions}</b><i>-{file.deletions}</i></span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
