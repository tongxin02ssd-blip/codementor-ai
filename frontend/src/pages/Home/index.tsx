import { Card, Col, Layout, Row, Steps, Typography } from 'antd';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader';
import './style.css';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const featureList = [
  {
    title: 'PR 变更摘要',
    description: '根据 PR 链接或 diff 文本，帮助用户快速理解本次代码改动内容。',
    icon: <BranchesOutlined />,
  },
  {
    title: '风险点识别',
    description: '辅助发现潜在问题，例如状态处理缺失、组件职责不清、错误处理不足等。',
    icon: <CodeOutlined />,
  },
  {
    title: 'AI Review 建议',
    description: '生成结构化 Review 建议，帮助开发者提升代码质量和 PR 表达质量。',
    icon: <RobotOutlined />,
  },
  {
    title: '合并建议判断',
    description: '根据代码风险和完成度，给出建议合并、修改后合并或暂不合并的判断。',
    icon: <CheckCircleOutlined />,
  },
];

export function Home() {
  return (
    <Layout className="home-layout">
      <Content className="home-content">
        <PageHeader />

        <section className="home-section">
          <Title level={2}>核心功能</Title>
          <Paragraph className="home-section__desc">
            当前版本先搭建产品首页结构，后续将逐步实现 PR 输入、Mock Review、结果展示和 AI
            分析能力。
          </Paragraph>

          <Row gutter={[16, 16]}>
            {featureList.map((feature) => (
              <Col xs={24} sm={12} lg={6} key={feature.title}>
                <Card className="feature-card" hoverable>
                  <div className="feature-card__icon">{feature.icon}</div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph className="feature-card__desc">{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="home-section">
          <Title level={2}>使用流程</Title>

          <Card>
            <Steps
              current={0}
              items={[
                {
                  title: '输入 PR',
                  description: '输入 GitHub PR 链接或粘贴 diff 文本',
                },
                {
                  title: 'AI 分析',
                  description: '系统分析代码变更内容和潜在风险',
                },
                {
                  title: '查看结果',
                  description: '展示摘要、风险点、优化建议和合并建议',
                },
              ]}
            />
          </Card>
        </section>
      </Content>
    </Layout>
  );
}