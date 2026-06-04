import { useState } from 'react';
import { Card, Col, Layout, Row, Steps, Typography, message } from 'antd';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/PageHeader';
import { ReviewForm } from '../../components/ReviewForm';
import { ReviewResult } from '../../components/ReviewResult';
import { analyzeReview } from '../../services/reviewService';
import type { ReviewFormValues, ReviewResult as ReviewResultType } from '../../types/review';
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '分析失败：系统暂时无法生成 Review 结果，请稍后重试。';
}

export function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResultType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async (values: ReviewFormValues) => {
    setIsAnalyzing(true);
    setReviewResult(null);
    setErrorMessage(null);

    try {
      const result = await analyzeReview(values);

      setReviewResult(result);
      message.success('Mock Review 分析完成');
    } catch (error) {
      const currentErrorMessage = getErrorMessage(error);

      setErrorMessage(currentErrorMessage);
      message.error(currentErrorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Layout className="home-layout">
      <Content className="home-content">
        <PageHeader />

        <section className="home-section">
          <ReviewForm loading={isAnalyzing} onSubmit={handleAnalyze} />
        </section>

        <section className="home-section">
          <ReviewResult loading={isAnalyzing} error={errorMessage} result={reviewResult} />
        </section>

        <section className="home-section">
          <Title level={2}>核心功能</Title>
          <Paragraph className="home-section__desc">
            当前版本已完成 PR Review 输入模块、Mock 分析流程、结构化结果展示和异常状态处理。
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
              current={reviewResult ? 2 : isAnalyzing ? 1 : 0}
              status={errorMessage ? 'error' : 'process'}
              items={[
                {
                  title: '输入 PR',
                  description: '输入 GitHub PR 链接或粘贴 diff 文本',
                },
                {
                  title: 'Mock 分析',
                  description: errorMessage ? '分析失败，请检查输入或稍后重试' : '系统模拟分析代码变更内容',
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