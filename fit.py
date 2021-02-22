# %%
import altair as alt
import pandas as pd

source = pd.read_csv('https://raw.githubusercontent.com/mweers/mweers.github.io/master/steps.csv')  

alt.Chart(source).mark_point(size=5,color='#CD5C5C').encode(
    alt.X('Date:T',
    scale=alt.Scale(zero=True)
    ),
    y='Steps:Q',
    tooltip=['Date:T','Steps:Q'],
).configure_axis(
    grid=False
).configure_view(
    strokeWidth=0
).properties(
    width=800,
    height=500
).interactive()