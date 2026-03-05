import { useNavigate } from 'react-router';
import {
  Typography,
  Box,
  Container,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import ContactSupportOutlinedIcon from '@mui/icons-material/ContactSupportOutlined';
import { useTranslation } from 'react-i18next';
import TopBar from '../components/TopBar';

function HelpSection({ icon, title, children }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          {icon}
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function HelpText({ children, sx }) {
  return (
    <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.8, ...sx }}>
      {children}
    </Typography>
  );
}

function StepItem({ number, text }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
      <Box sx={{
        minWidth: 24,
        height: 24,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        mt: 0.2,
      }}>
        {number}
      </Box>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.8 }}>
        {text}
      </Typography>
    </Stack>
  );
}

function FAQItem({ question, answer }) {
  return (
    <Box sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        {question}
      </Typography>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.8 }}>
        {answer}
      </Typography>
    </Box>
  );
}

export default function HelpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const iconSx = { fontSize: 20, color: 'primary.main' };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopBar onBack={() => navigate(-1)} showHelp={false} />

      {/* 主内容区 */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 3, px: 3 }}>
        <Container maxWidth="md" disableGutters>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary', mb: 2.5 }}>
            {t('help.title')}
          </Typography>

          <HelpSection icon={<InfoOutlinedIcon sx={iconSx} />} title={t('help.intro.title')}>
            <HelpText>{t('help.intro.desc')}</HelpText>
            <HelpText sx={{ mt: 1 }}>{t('help.intro.features')}</HelpText>
          </HelpSection>

          <HelpSection icon={<RocketLaunchOutlinedIcon sx={iconSx} />} title={t('help.quickStart.title')}>
            <StepItem number={1} text={t('help.quickStart.step1')} />
            <StepItem number={2} text={t('help.quickStart.step2')} />
            <StepItem number={3} text={t('help.quickStart.step3')} />
            <StepItem number={4} text={t('help.quickStart.step4')} />
            <StepItem number={5} text={t('help.quickStart.step5')} />
          </HelpSection>

          <HelpSection icon={<SettingsOutlinedIcon sx={iconSx} />} title={t('help.settings.title')}>
            <HelpText>{t('help.settings.format')}</HelpText>
            <HelpText sx={{ mt: 1 }}>{t('help.settings.scoring')}</HelpText>
            <HelpText sx={{ mt: 1 }}>{t('help.settings.tiebreakers')}</HelpText>
          </HelpSection>

          <HelpSection icon={<PeopleOutlinedIcon sx={iconSx} />} title={t('help.players.title')}>
            <HelpText>{t('help.players.desc')}</HelpText>
          </HelpSection>

          <HelpSection icon={<ViewListOutlinedIcon sx={iconSx} />} title={t('help.rounds.title')}>
            <HelpText>{t('help.rounds.desc')}</HelpText>
          </HelpSection>

          <HelpSection icon={<EmojiEventsOutlinedIcon sx={iconSx} />} title={t('help.rankings.title')}>
            <HelpText>{t('help.rankings.desc')}</HelpText>
          </HelpSection>

          <HelpSection icon={<QuestionAnswerOutlinedIcon sx={iconSx} />} title={t('help.faq.title')}>
            <FAQItem question={t('help.faq.q1')} answer={t('help.faq.a1')} />
            <Divider sx={{ my: 1.5 }} />
            <FAQItem question={t('help.faq.q2')} answer={t('help.faq.a2')} />
            <Divider sx={{ my: 1.5 }} />
            <FAQItem question={t('help.faq.q3')} answer={t('help.faq.a3')} />
            <Divider sx={{ my: 1.5 }} />
            <FAQItem question={t('help.faq.q4')} answer={t('help.faq.a4')} />
          </HelpSection>

          <HelpSection icon={<ContactSupportOutlinedIcon sx={iconSx} />} title={t('help.about.title')}>
            <HelpText>{t('help.about.version')}</HelpText>
            <HelpText sx={{ mt: 1 }}>{t('help.about.website')}</HelpText>
            <HelpText sx={{ mt: 1 }}>{t('help.about.feedback')}</HelpText>
          </HelpSection>
        </Container>
      </Box>
    </Box>
  );
}
