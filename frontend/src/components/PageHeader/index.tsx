import { Typography, Tag } from 'antd';
import './style.css';

const { Title, Paragraph } = Typography;

export function PageHeader() {
  return (
    <header className="page-header">
      <div className="page-header__tag-row">
        <Tag color="blue">AI PR Review</Tag>
        <Tag color="green">React</Tag>
        <Tag color="purple">TypeScript</Tag>
      </div>

      <Title className="page-header__title">CodeMentor AI</Title>

      <Paragraph className="page-header__desc">
        面向前端新人和小团队开发者的 AI PR Review 助手，帮助用户快速理解 Pull Request
        变更内容，识别潜在风险，并生成结构化 Review 建议。
      </Paragraph>
    </header>
  );
}