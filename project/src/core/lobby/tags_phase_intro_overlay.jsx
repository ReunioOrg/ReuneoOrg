import { AnimatePresence, motion } from 'framer-motion';
import './tags_phase_intro_overlay.css';

const PHASE_TEXT = {
    self: 'Who are you?',
    desiring: 'Who do you want to meet?',
};

const TagsPhaseIntroOverlay = ({ isVisible, phase }) => (
    <AnimatePresence>
        {isVisible && (
            <motion.div
                key="tags-phase-intro"
                className="tags-phase-intro-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <motion.h2
                    className="tags-phase-intro-text"
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.2, ease: 'easeOut' }}
                >
                    {PHASE_TEXT[phase] || PHASE_TEXT.self}
                </motion.h2>
            </motion.div>
        )}
    </AnimatePresence>
);

export default TagsPhaseIntroOverlay;
