import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedTagList from './animated_tag_list';
import { useBodyScrollLock } from './useBodyScrollLock';
import {
    MAX_TAGS_ALLOWED,
    TAG_LIMIT_MESSAGE,
    canSaveTags,
    toggleTagSelection,
} from './tagSelection';
import './TagPickerModal.css';

const STEP_SELF = 'self';
const STEP_DESIRING = 'desiring';

const TagPickerModal = ({
    isOpen,
    mode,
    availableTags,
    initialSelfTags,
    initialDesiringTags,
    isDemo,
    onFinish,
    onDismiss,
}) => {
    const [step, setStep] = useState(STEP_SELF);
    const [selfTags, setSelfTags] = useState([]);
    const [desiringTags, setDesiringTags] = useState([]);
    const [limitWarning, setLimitWarning] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return undefined;
        setStep(STEP_SELF);
        setSelfTags(Array.isArray(initialSelfTags) ? [...initialSelfTags] : []);
        setDesiringTags(Array.isArray(initialDesiringTags) ? [...initialDesiringTags] : []);
        setLimitWarning('');
        setError('');
        setSaving(false);
        return undefined;
        // Seed once per open. Later polls must not wipe an in-progress edit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!limitWarning) return undefined;
        const timer = setTimeout(() => setLimitWarning(''), 3000);
        return () => clearTimeout(timer);
    }, [limitWarning]);

    useEffect(() => {
        if (!isOpen || mode !== 'edit') return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') onDismiss();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, mode, onDismiss]);

    const tags = Array.isArray(availableTags) ? availableTags : [];
    const activeTags = step === STEP_SELF ? selfTags : desiringTags;
    const title = step === STEP_SELF ? 'Who are you?' : 'Who do you want to meet?';
    const finishBlocked = !canSaveTags(selfTags, desiringTags) || saving;

    const handleTagChange = (tag) => {
        const result = toggleTagSelection({
            localTags: step === STEP_SELF ? selfTags : desiringTags,
            serverTags: step === STEP_SELF ? initialSelfTags : initialDesiringTags,
            tag,
        });
        if (result.blocked) {
            setLimitWarning(TAG_LIMIT_MESSAGE);
            return;
        }
        setLimitWarning('');
        if (step === STEP_SELF) setSelfTags(result.tags);
        else setDesiringTags(result.tags);
    };

    const handleFinish = async () => {
        if (!canSaveTags(selfTags, desiringTags) || saving) return;
        setSaving(true);
        setError('');
        try {
            const result = await onFinish(selfTags, desiringTags);
            if (!result?.ok) {
                setError(result?.error || 'Could not save your tags. Try again.');
                setSaving(false);
            }
        } catch {
            setError('Something went wrong. Try again.');
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="tag-picker-overlay"
                    role="presentation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="tag-picker-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tag-picker-title"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    >
                        <div className="tag-picker-progress" role="tablist" aria-label="Tag steps">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={step === STEP_SELF}
                                aria-label="Who are you?"
                                className="is-filled"
                                onClick={() => setStep(STEP_SELF)}
                            />
                            <button
                                type="button"
                                role="tab"
                                aria-selected={step === STEP_DESIRING}
                                aria-label="Who do you want to meet?"
                                className={step === STEP_DESIRING ? 'is-filled' : ''}
                                onClick={() => setStep(STEP_DESIRING)}
                            />
                        </div>

                        <div className={`tag-picker-header${mode === 'edit' ? ' has-close' : ''}`}>
                            <h2 id="tag-picker-title" className="tag-picker-title">{title}</h2>
                            {mode === 'edit' && (
                                <button
                                    type="button"
                                    className="tag-picker-close"
                                    aria-label="Close"
                                    onClick={onDismiss}
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {isDemo && (
                            <p className="tag-picker-demo-hint">Select tags to see how pairing works.</p>
                        )}

                        <div className="tag-picker-body">
                            <AnimatedTagList
                                tags={tags}
                                selectedTags={activeTags}
                                onTagChange={handleTagChange}
                                showGradients={true}
                                enableArrowNavigation={true}
                                displayScrollbar={true}
                                maxHeight={300}
                            />
                        </div>

                        {limitWarning && (
                            <p className="tag-picker-warning" role="status">{limitWarning}</p>
                        )}
                        {error && (
                            <p className="tag-picker-error" role="alert">{error}</p>
                        )}

                        <div className="tag-picker-footer">
                            {step === STEP_DESIRING ? (
                                <button
                                    type="button"
                                    className="tag-picker-back"
                                    onClick={() => setStep(STEP_SELF)}
                                    disabled={saving}
                                >
                                    Back
                                </button>
                            ) : (
                                <span className="tag-picker-back-spacer" />
                            )}
                            <span className="tag-picker-count">
                                {activeTags.length}/{MAX_TAGS_ALLOWED}
                            </span>
                            {step === STEP_SELF ? (
                                <button
                                    type="button"
                                    className="tag-picker-primary"
                                    onClick={() => setStep(STEP_DESIRING)}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="tag-picker-primary"
                                    onClick={handleFinish}
                                    disabled={finishBlocked}
                                >
                                    {saving ? 'Saving…' : 'Finish'}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TagPickerModal;
