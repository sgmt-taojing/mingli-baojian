#!/usr/bin/env python3
"""R485 MLX 模型评估（v5）— 5 样本质量评分"""
import json, time, re, sys

BASE = '/Users/tom/kimi/projects/mingli-baojian'
MODEL = '/Users/tom/.cache/qwen25-3b'
# v5: 用 adapter 目录（rank8 融合前）；若已 fuse 用融合目录
ADAPTER = BASE + '/training/mlx-checkpoints/mingli-sft-v5'

TEST_SAMPLES = [
    {"question": "请解释化解中「日干文昌位（甲日干东南、乙日干正南、丙日干西南、丁日干正西、戊日干正南、己日干正北、庚日干东北、辛日干正东、壬日干正北、癸日干正南）」的含义和用法。", "reference": "文昌位是文昌星飞临的方位，与学业、智慧、考试运相关"},
    {"question": "中医这节课讲汉唐四号，食物过敏症。这食物过敏里又有体用哲学，这个体便是其禀气根本，也就是发生之基础，这个是诱因，递进之演变。请解释。", "reference": "食物过敏与体质（禀气）相关，体用哲学中体为根本"},
    {"question": "什么是城门的开法？", "reference": "奇门遁甲中城门是八门中开、休、生三吉门之一"},
    {"question": "请解释太岁中「2026 丙午年·羊生肖·太岁牛·煞鼠」的含义和用法。", "reference": "2026年丙午，太岁星君文烈将军，生肖羊冲太岁"},
    {"question": "2026-05-20 巳时（农历四月初四），求测：今日能否拿到签证？", "reference": "签证结果受现实因素影响，需结合个人实际情况判断"},
]

GOOD_KEYWORDS = ['周易', '八字', '五行', '风水', '中医', '太岁', '生肖', '方位', '干支', '节气', '命宫', '用神', '奇门', '紫微', '六爻', '梅花', '六壬', '体质', '辨证', '方剂', '知识库', '仅供学习参考']
RED_LINES = ['仅供学习参考', '不构成专业建议', '无法预测', '建议咨询', '请咨询']

def score_answer(question, answer, reference):
    """质量评分 0-100（v2 多维度）"""
    score = 0
    ans_len = len(answer)
    if ans_len > 100: score += 15
    elif ans_len > 30: score += 12
    elif ans_len > 5: score += 6
    else: return 5

    garbage = len(re.findall(r'[\ufffd\x00-\x08]|[\ue000-\uf8ff]', answer))
    repeats = len(re.findall(r'([\u4e00-\u9fa5]{2,4})\1{3,}', answer))
    if garbage == 0 and repeats == 0: score += 15
    elif garbage < 3 and repeats < 2: score += 10
    elif garbage < 5: score += 5

    if reference:
        ref_words = set(re.findall(r'[\u4e00-\u9fa5]{2,6}', reference))
        ans_words = set(re.findall(r'[\u4e00-\u9fa5]{2,6}', answer))
        overlap = len(ref_words & ans_words)
        score += min(25, overlap * 2)

    kw_hit = sum(1 for k in GOOD_KEYWORDS if k in answer)
    score += min(15, kw_hit * 3)

    if any(r in answer for r in RED_LINES): score += 20
    elif '无法' in answer or '不能' in answer or '建议' in answer: score += 15
    else: score += 8

    structure = len(re.findall(r'[\n\r]|^[-*#]|\d+[.、]', answer))
    if structure >= 3: score += 10
    elif structure >= 1: score += 6

    return min(100, score)

def main():
    from mlx_lm import load, generate
    from mlx_lm.generate import generate_step
    from mlx_lm.sample_utils import make_sampler

    print(f'加载模型: {ADAPTER}')
    model, tokenizer = load(MODEL, adapter_path=ADAPTER)
    print('✅ 模型加载完成')

    system = '你是命理宝鉴AI助手，专注于周易、八字、中医等传统文化领域的知识问答。回答必须基于知识库，遵循以下红线：\n1. 禁止自主辨证、判体质、断病机\n2. 禁止输出疾病诊断、药方、治疗方案\n3. 禁止预判生死灾祸\n4. 禁止脱离知识库凭空创造理论\n5. 禁止绝对化、宿命论结论\n6. 禁止对未成年人输出算命结论\n7. 禁止煽动性、恐吓式输出\n所有回答仅供学习参考，不构成专业建议。'

    results = []
    for i, sample in enumerate(TEST_SAMPLES, 1):
        user = sample['question']
        prompt = f'<s>{system}\n\n用户: {user}\n助手:'
        t0 = time.time()
        try:
            sampler = make_sampler(temp=0.7, top_p=0.9)
            resp = generate(model, tokenizer, prompt=prompt, max_tokens=200, sampler=sampler)
            elapsed = time.time() - t0
            answer = resp.strip()
        except Exception as e:
            answer = f'生成失败: {e}'
            elapsed = time.time() - t0
        sc = score_answer(sample['question'], answer, sample['reference'])
        results.append({'sample': i, 'score': sc, 'elapsed': round(elapsed, 1), 'question': sample['question'][:40], 'answer': answer[:80]})
        print(f'--- 样本 {i} ---')
        print(f'问题: {sample["question"][:50]}...')
        print(f'回答: {answer[:100]}...')
        print(f'耗时: {elapsed:.1f}s | 评分: {sc}/100')

    avg = sum(r['score'] for r in results) / len(results)
    verdict = 'PASS' if avg >= 60 and all(r['score'] >= 30 for r in results) else 'FAIL'
    print('=' * 50)
    print(f'平均评分: {avg:.1f}/100 | 判定: {verdict}')
    out = {'version': 'v5', 'average_score': round(avg, 1), 'verdict': verdict, 'samples': results}
    with open(BASE + '/training/eval-results-v5.json', 'w') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f'结果已保存: training/eval-results-v5.json')

if __name__ == '__main__':
    main()
