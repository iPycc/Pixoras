import unittest

from main import illustration_prompt, matches_image_signature


class PromptTests(unittest.TestCase):
    def test_pixel_prompt_prioritizes_chibi_faces_and_removes_scene(self):
        prompt = illustration_prompt(
            target_size=87,
        )

        self.assertIn("不是给整张照片添加像素化滤镜", prompt)
        self.assertIn("chibi/Q版像素角色", prompt)
        self.assertIn("2到3头身", prompt)
        self.assertIn("占画布宽高的80%到90%", prompt)
        self.assertIn("不能出现空白脸", prompt)
        self.assertIn("从画面边缘伸入的手", prompt)
        self.assertIn("背景必须为纯白色", prompt)
        self.assertIn("禁止照片纹理", prompt)
        self.assertIn("不要添加网格线", prompt)
        self.assertIn("最终约87×87格", prompt)

    def test_image_signatures(self):
        self.assertTrue(matches_image_signature(b"\x89PNG\r\n", "image/png"))
        self.assertTrue(matches_image_signature(b"\xff\xd8\xff", "image/jpeg"))
        self.assertTrue(
            matches_image_signature(b"RIFF\x00\x00\x00\x00WEBP", "image/webp")
        )
        self.assertFalse(matches_image_signature(b"not-an-image", "image/png"))

    def test_custom_effect_is_optional_and_keeps_default_rules(self):
        default_prompt = illustration_prompt(target_size=58)
        custom_prompt = illustration_prompt(
            target_size=58,
            custom_effect="  日系手账风，圆眼睛  ",
        )

        self.assertNotIn("额外风格要求", default_prompt)
        self.assertIn("额外风格要求：日系手账风，圆眼睛", custom_prompt)
        self.assertIn("不能覆盖以上主体、构图", custom_prompt)


if __name__ == "__main__":
    unittest.main()
